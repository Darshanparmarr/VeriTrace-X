# VeriTrace-X — ML pipeline

Reproducible training + evaluation for the fraud-risk model. Self-contained around the
DataCo Smart Supply Chain schema.

## Data
Place the real dataset at `ml/data/raw/DataCoSupplyChainDataset.csv`
(Kaggle / Mendeley; ~95 MB, latin-1 encoded — the loader handles that). It is **git-ignored**.
If no file is present, training falls back to a **synthetic generator** (clearly labelled) that
emits the same column names, so the real-data run is a drop-in.

## Train
```bash
cd ml
# uses the backend venv which already has the ML deps:
../backend/.venv/Scripts/python.exe -m veritrace_ml.train
# or a standalone env:  pip install -r requirements.txt && python -m veritrace_ml.train
```
Outputs to `ml/artifacts/`:
- `model.joblib` — full sklearn Pipeline (preprocessing + classifier)
- `background.joblib` — SHAP background sample
- `model_meta.json` — algorithm, version, metrics, global SHAP importance, limitations

The backend loads these **once** at startup (never retrains per request). Restart the backend
after retraining to pick up the new artifact.

## What the pipeline does
1. Load data (real or synthetic), derive label `Order Status == SUSPECTED_FRAUD`.
2. Build leakage-safe features (payment type, order value, quantity, discount, shipping days +
   engineered delay, product/category/segment/region/mode). Excludes id/label/raw-date.
3. Stratified 70/15/15 split; class-imbalance handling (class weights / `scale_pos_weight`).
4. Train & compare Logistic Regression, Random Forest, XGBoost.
5. Select by **validation PR-AUC**; refit on train+val; evaluate on the held-out test set.
6. Compute global SHAP importance; save artifact + metadata.

See [`../docs/model-evaluation.md`](../docs/model-evaluation.md) for measured results and honest
interpretation.

## Package layout
```
veritrace_ml/
  data.py       load real/synthetic data
  features.py   feature contract (shared with the backend for consistent scoring)
  pipeline.py   preprocessing + candidate models
  evaluate.py   metrics (precision/recall/F1/ROC-AUC/PR-AUC/confusion)
  explain.py    SHAP global + local explanations (used by the backend too)
  train.py      orchestrator  (python -m veritrace_ml.train)
```
