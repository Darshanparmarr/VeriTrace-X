"""Reproducible training + evaluation pipeline.

Run:  python -m veritrace_ml.train          (from the ml/ directory)
Loads the real DataCo CSV from ml/data/raw if present, else synthetic data.
Compares Logistic Regression / Random Forest / XGBoost, selects by validation
PR-AUC, evaluates on a held-out test set, and saves a versioned artifact + meta.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.model_selection import train_test_split

from .data import load_dataset
from .evaluate import evaluate
from .explain import ShapExplainer
from .features import build_features, feature_contract
from .pipeline import candidate_models, make_pipeline

ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "model.joblib"
BACKGROUND_PATH = ARTIFACT_DIR / "background.joblib"
META_PATH = ARTIFACT_DIR / "model_meta.json"

RANDOM_STATE = 42
DEFAULT_THRESHOLD = 0.5


def main() -> dict:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    df, source = load_dataset()
    X, y = build_features(df)
    if y is None or y.nunique() < 2:
        raise SystemExit(
            "Training needs a labelled dataset with an 'Order Status' column containing "
            "both SUSPECTED_FRAUD and non-fraud rows."
        )

    print(f"[data] source={source} rows={len(X)} positives={int(y.sum())} "
          f"({y.mean() * 100:.2f}%)")

    # Stratified 70/15/15 train/val/test.
    X_tr, X_tmp, y_tr, y_tmp = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=RANDOM_STATE
    )
    X_val, X_te, y_val, y_te = train_test_split(
        X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=RANDOM_STATE
    )

    pos = int(y_tr.sum())
    neg = int(len(y_tr) - pos)
    pos_weight = max(neg / max(pos, 1), 1.0)

    # Train & compare candidates; select by validation PR-AUC.
    comparison: dict[str, dict] = {}
    best_name, best_pipe, best_pr = None, None, -1.0
    for name, est in candidate_models(pos_weight).items():
        pipe = make_pipeline(est)
        pipe.fit(X_tr, y_tr)
        val_prob = pipe.predict_proba(X_val)[:, 1]
        val_metrics = evaluate(y_val, val_prob, DEFAULT_THRESHOLD)
        comparison[name] = {"validation": val_metrics}
        print(f"[model] {name:20s} val PR-AUC={val_metrics['pr_auc']:.4f} "
              f"ROC-AUC={val_metrics['roc_auc']:.4f} F1={val_metrics['f1']:.4f}")
        if (val_metrics["pr_auc"] or 0) > best_pr:
            best_name, best_pipe, best_pr = name, pipe, val_metrics["pr_auc"]

    print(f"[select] best by validation PR-AUC -> {best_name}")

    # Refit the winner on train+val, evaluate on the untouched test set.
    X_trval = _concat(X_tr, X_val)
    y_trval = _concat(y_tr, y_val)
    best_pipe = make_pipeline(candidate_models(pos_weight)[best_name])
    best_pipe.fit(X_trval, y_trval)
    test_prob = best_pipe.predict_proba(X_te)[:, 1]
    test_metrics = evaluate(y_te, test_prob, DEFAULT_THRESHOLD)
    comparison[best_name]["test"] = test_metrics
    print(f"[test] {best_name} PR-AUC={test_metrics['pr_auc']:.4f} "
          f"ROC-AUC={test_metrics['roc_auc']:.4f} recall={test_metrics['recall']:.4f} "
          f"precision={test_metrics['precision']:.4f}")

    # Global SHAP importance from a small background sample (kept small so SHAP is
    # fast at train time and when the backend rebuilds the explainer at startup).
    bg = X_trval.sample(min(100, len(X_trval)), random_state=RANDOM_STATE)
    explainer = ShapExplainer(best_pipe, bg)
    global_importance = explainer.global_importance(
        X_te.sample(min(150, len(X_te)), random_state=RANDOM_STATE)
    )

    algorithm = {
        "logistic_regression": "Logistic Regression",
        "random_forest": "Random Forest",
        "xgboost": "XGBoost",
    }[best_name]
    trained_at = datetime.now(timezone.utc).isoformat()
    version = f"{best_name}-{source}-{datetime.now(timezone.utc):%Y%m%d%H%M}"

    meta = {
        "name": "VeriTrace-X fraud risk",
        "algorithm": algorithm,
        "model_key": best_name,
        "version": version,
        "trained_at": trained_at,
        "data_source": source,  # "synthetic" or "dataco"
        "is_synthetic": source == "synthetic",
        "n_train": int(len(X_trval)),
        "n_test": int(len(X_te)),
        "class_balance": {"positives": int(y.sum()), "total": int(len(y)),
                          "positive_rate": float(y.mean())},
        "threshold_default": DEFAULT_THRESHOLD,
        "risk_band_thresholds": {"low": 0.25, "medium": 0.5, "high": 0.75},
        "metrics": {"selected": comparison[best_name], "all_models": comparison},
        "shap_method": explainer.method,
        "global_importance": global_importance,
        "feature_contract": feature_contract(),
        "limitations": [
            "Scores are uncalibrated likelihoods, not probabilities of guilt.",
            "SHAP contributions show model influence/correlation, not causal proof of fraud.",
            "The label is *suspected* fraud (Order Status), not human-confirmed fraud.",
            ("Trained on SYNTHETIC data — metrics are illustrative. Retrain on the real DataCo "
             "CSV (ml/data/raw/) to obtain real performance.")
            if source == "synthetic"
            else "Trained on the DataCo Smart Supply Chain dataset.",
        ],
    }

    joblib.dump(best_pipe, MODEL_PATH)
    joblib.dump(bg, BACKGROUND_PATH)
    META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"[save] {MODEL_PATH.name}, {BACKGROUND_PATH.name}, {META_PATH.name} -> {ARTIFACT_DIR}")
    return meta


def _concat(a, b):
    import pandas as pd
    return pd.concat([a, b], axis=0)


if __name__ == "__main__":
    main()
