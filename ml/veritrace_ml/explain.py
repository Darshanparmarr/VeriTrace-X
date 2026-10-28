"""SHAP explanations for the fitted pipeline.

Shared by training (global importance) and the backend (per-transaction local
explanations), so both agree on how contributions are computed and aggregated
from transformed (one-hot) columns back to the original canonical features.

Contributions describe the model's reasoning (correlation/influence) — NOT proof
of fraud. The caller surfaces that caveat.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import shap

from .features import CATEGORICAL, FEATURE_COLUMNS, NUMERIC_FEATURES

# Human-readable phrasing per canonical feature for plain-English summaries.
FEATURE_LABELS = {
    "order_value": "Order value",
    "quantity": "Order quantity",
    "discount_rate": "Discount rate",
    "days_shipping_real": "Actual shipping days",
    "days_shipping_scheduled": "Scheduled shipping days",
    "shipping_delay": "Shipping delay (actual − scheduled)",
    "payment_type": "Payment type",
    "product_name": "Product",
    "category_name": "Category",
    "customer_segment": "Customer segment",
    "order_region": "Order region",
    "shipping_mode": "Shipping mode",
}


def _strip_prefix(name: str) -> str:
    for p in ("num__", "cat__"):
        if name.startswith(p):
            return name[len(p):]
    return name


def _canonical_of(transformed_name: str) -> str | None:
    """Map a ColumnTransformer output column to its canonical feature."""
    stripped = _strip_prefix(transformed_name)
    if stripped in NUMERIC_FEATURES:
        return stripped
    for feat in CATEGORICAL:
        if stripped == feat or stripped.startswith(feat + "_"):
            return feat
    return None


def _preprocessor(pipeline):
    return pipeline.named_steps["pre"]


def _classifier(pipeline):
    return pipeline.named_steps["clf"]


def _build_explainer(pipeline, background: np.ndarray):
    """TreeExplainer for tree models, else a model-agnostic explainer."""
    clf = _classifier(pipeline)
    name = type(clf).__name__.lower()
    if "forest" in name or "xgb" in name or "boost" in name or "tree" in name:
        return shap.TreeExplainer(clf), "shap_tree"
    # Linear / other: use the generic explainer over predict_proba.
    masker = shap.maskers.Independent(background, max_samples=100)
    return shap.Explainer(lambda X: clf.predict_proba(X)[:, 1], masker), "shap_generic"


def _positive_shap(explainer, Xt: np.ndarray) -> tuple[np.ndarray, float]:
    """Return (shap_values[n, n_features], base_value) for the positive class."""
    out = explainer(Xt) if not hasattr(explainer, "shap_values") else None
    if out is not None:
        vals = np.asarray(out.values)
        base = out.base_values
    else:
        vals = np.asarray(explainer.shap_values(Xt))
        base = explainer.expected_value

    # Normalise shapes to (n, features) for the positive class.
    if vals.ndim == 3:
        if vals.shape[0] == 2:          # (classes, n, f)
            vals = vals[1]
        elif vals.shape[-1] == 2:        # (n, f, classes)
            vals = vals[:, :, 1]
        else:
            vals = vals[..., -1]
    base_val = base
    if isinstance(base, (list, tuple, np.ndarray)):
        arr = np.ravel(np.asarray(base, dtype=float))
        base_val = float(arr[-1] if arr.size > 1 else arr[0])
    return vals, float(base_val)


def _aggregate(vals_row: np.ndarray, feature_names: list[str]) -> dict[str, float]:
    """Sum transformed-column contributions into canonical features."""
    agg: dict[str, float] = {f: 0.0 for f in FEATURE_COLUMNS}
    for name, v in zip(feature_names, vals_row):
        canon = _canonical_of(name)
        if canon is not None:
            agg[canon] += float(v)
    return agg


class ShapExplainer:
    """Caches the SHAP explainer + preprocessing for repeated local explanations."""

    def __init__(self, pipeline, background_X: pd.DataFrame):
        self.pipeline = pipeline
        pre = _preprocessor(pipeline)
        self.feature_names = list(pre.get_feature_names_out())
        bg = pre.transform(background_X)
        self.background = bg.toarray() if hasattr(bg, "toarray") else np.asarray(bg)
        self.explainer, self.method = _build_explainer(pipeline, self.background)

    def _transform(self, X: pd.DataFrame) -> np.ndarray:
        Xt = _preprocessor(self.pipeline).transform(X)
        return Xt.toarray() if hasattr(Xt, "toarray") else np.asarray(Xt)

    def local(self, X_row: pd.DataFrame, top_k: int = 8) -> dict:
        Xt = self._transform(X_row)
        vals, base = _positive_shap(self.explainer, Xt)
        agg = _aggregate(vals[0], self.feature_names)
        contribs = [
            {
                "feature": f,
                "label": FEATURE_LABELS.get(f, f),
                "value": round(v, 5),
                "direction": "increases" if v >= 0 else "decreases",
            }
            for f, v in agg.items()
            if abs(v) > 1e-6
        ]
        contribs.sort(key=lambda c: abs(c["value"]), reverse=True)
        return {"method": self.method, "base_value": round(base, 5), "contributions": contribs[:top_k]}

    def global_importance(self, X_sample: pd.DataFrame, top_k: int = 12) -> list[dict]:
        Xt = self._transform(X_sample)
        vals, _ = _positive_shap(self.explainer, Xt)
        mean_abs = np.abs(vals).mean(axis=0)
        agg: dict[str, float] = {f: 0.0 for f in FEATURE_COLUMNS}
        for name, v in zip(self.feature_names, mean_abs):
            canon = _canonical_of(name)
            if canon is not None:
                agg[canon] += float(v)
        items = [
            {"feature": f, "label": FEATURE_LABELS.get(f, f), "importance": round(v, 5)}
            for f, v in agg.items()
        ]
        items.sort(key=lambda c: c["importance"], reverse=True)
        return items[:top_k]


def plain_english(contributions: list[dict], top_n: int = 3) -> list[str]:
    """Turn the top contributions into readable 'why flagged' bullets."""
    out = []
    for c in contributions[:top_n]:
        verb = "raises" if c["direction"] == "increases" else "lowers"
        out.append(f"{c['label']} {verb} the risk for this order.")
    return out
