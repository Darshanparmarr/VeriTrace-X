# Model evaluation methodology (Phase 3)

> This document is filled with **measured** results once training runs. Nothing here claims
> performance before it is measured.

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

## Limitations (to be expanded)
- Scores are uncalibrated unless a calibration step is reported; a score is not a probability of guilt.
- Feature contributions (SHAP/LIME) show correlation/model influence, not causal proof.
- Known biases and data-quality caveats are listed here after analysis.
