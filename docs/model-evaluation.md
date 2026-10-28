# Model evaluation methodology & results

> Measured results below are from a real training run on the DataCo dataset
> (`random_forest-dataco`, 2026-10-28). Reproduce with `python -m veritrace_ml.train` in `ml/`.

## Dataset
- **DataCo Smart Supply Chain** (~180,519 order-line records). Used as research context.
- Reported ~2.25% **suspected**-fraud rate — this is a dataset label, **not** confirmed fraud and
  **not** a validated model metric.

## Target definition
The label column and its exact meaning are inspected and documented before modelling. Suspected
fraud (dataset label), model prediction, and human-confirmed fraud are kept strictly distinct.

## Pipeline (reproducible)
1. Inspect schema; document columns, types, missingness.
2. Clean: handle missing values and duplicates explicitly (no silent drops).
3. **Leakage control**: remove post-outcome fields; fit all transforms on the training split only.
4. Split: stratified train/validation (and held-out test), with a time-aware option.
5. **Class imbalance**: justified handling (class weights and/or resampling on the training fold only).
6. Train & compare: Logistic Regression, Random Forest, XGBoost.
7. Evaluate: precision, recall, F1, confusion matrix, ROC-AUC, PR-AUC (PR-AUC emphasised for
   imbalanced fraud detection).
8. Select on measured validation performance + operational fit (recall vs. review workload).
9. Persist the fitted preprocessing + model as a versioned artifact; record training timestamp.

## Thresholds
Risk bands (Low/Medium/High/Critical) map from the model score via documented, configurable
thresholds (defaults: 0.25 / 0.50 / 0.75). These are operating-point choices, not calibrated
fraud probabilities.

## Features used
`payment_type` (DataCo `Type`), `order_value` (Sales), `quantity`, `discount_rate`,
`days_shipping_real`, `days_shipping_scheduled`, engineered `shipping_delay` (real − scheduled),
`product_name`, `category_name`, `customer_segment`, `order_region`, `shipping_mode`.
Numeric: median-impute + standardise. Categorical: most-frequent-impute + one-hot (min_frequency 1%).
**Excluded to prevent leakage/identifiers:** `order_id`, `order_status` (the label source), raw dates.

## Measured results (DataCo, 180,519 order-lines, 2.25% suspected fraud)

Stratified 70/15/15 train/val/test. Imbalance handled via class weights (LR/RF) and
`scale_pos_weight` (XGBoost). Model selected by **validation PR-AUC**.

| Model | Val PR-AUC | Val ROC-AUC | Val F1 |
|---|---|---|---|
| Logistic Regression | 0.096 | 0.879 | 0.151 |
| **Random Forest (selected)** | **0.104** | 0.888 | 0.152 |
| XGBoost | 0.100 | 0.889 | 0.162 |

**Held-out test (Random Forest, threshold 0.5):**
ROC-AUC **0.890** · PR-AUC **0.108** (baseline = prevalence 0.0225) ·
Recall **0.998** · Precision **0.083** · F1 0.153.
Confusion matrix: TP 608, FN 1, FP 6,758, TN 19,711.

**Global SHAP importance** is dominated by `payment_type` — consistent with the dataset fact
that **100% of SUSPECTED_FRAUD orders are TRANSFER payments** (TRANSFER fraud rate 8.1%).

## Honest interpretation
- With balanced class weights at threshold 0.5 the model is a **high-recall screen**: it catches
  nearly all suspected-fraud rows (recall 99.8%) but at low precision (8.3%), i.e. many false
  positives. This is expected for a rare positive class and an un-tuned threshold.
- ROC-AUC 0.89 reflects genuine ranking ability; PR-AUC 0.108 (≈5× the 0.0225 base rate) shows
  modest separation *beyond* the payment-type signal. Improving precision needs threshold tuning
  (operating point), probability calibration, and/or richer features.
- The score is an **uncalibrated** risk signal, not a probability of guilt, and is distinct from
  model confidence.

## Limitations
- Feature contributions (SHAP/LIME) show correlation/model influence, **not causal proof** of fraud.
- The label is **suspected** fraud (`Order Status`), not human-confirmed fraud.
- Scores are uncalibrated unless a calibration step is reported.
- `payment_type` dominates; the model partly learns "fraud lives in TRANSFER orders". Separating
  fraud *within* TRANSFER is the harder, more valuable task and is where precision suffers.
- Per-analysis scoring is capped at 5,000 stored rows in the demo for responsiveness.
