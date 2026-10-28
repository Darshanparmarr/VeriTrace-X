"""Feature schema + raw-to-feature mapping for VeriTrace-X.

Maps source columns (DataCo names or canonical names) to the model's feature set.
The label is derived from Order Status == SUSPECTED_FRAUD. The label column, the
order identifier, and the raw date are EXCLUDED from features to avoid leakage.

Kept deliberately small and dependency-free so both the training pipeline (ml/) and
the backend inference service can agree on the exact feature contract.
"""
from __future__ import annotations

import pandas as pd

SUSPECTED_FRAUD_VALUE = "SUSPECTED_FRAUD"

# canonical feature name -> accepted source aliases (normalized match)
_ALIASES: dict[str, tuple[str, ...]] = {
    "order_value": ("sales", "order value", "order item total", "order_value", "amount"),
    "quantity": ("order item quantity", "quantity", "qty"),
    "discount_rate": ("order item discount rate", "discount rate", "discount", "discount_rate"),
    "days_shipping_real": ("days for shipping real", "days for shipping (real)", "shipping days", "days_shipping_real"),
    "days_shipping_scheduled": ("days for shipment scheduled", "days for shipment (scheduled)", "scheduled days", "days_shipping_scheduled"),
    "product_name": ("product name", "product", "item", "product_name"),
    "category_name": ("category name", "category", "department name", "category_name"),
    "customer_segment": ("customer segment", "segment", "market", "customer_segment"),
    "order_region": ("order region", "region", "order country", "order_region"),
    "shipping_mode": ("shipping mode", "ship mode", "shipping_mode"),
    # Payment type (DataCo "Type"): known at order time, strongly associated with
    # suspected fraud (all SUSPECTED_FRAUD orders are TRANSFER). Not post-outcome.
    "payment_type": ("type", "payment type", "transaction type", "payment_type"),
}
_LABEL_ALIASES = ("order status", "order_status", "status")

NUMERIC_BASE = ["order_value", "quantity", "discount_rate", "days_shipping_real", "days_shipping_scheduled"]
CATEGORICAL = ["payment_type", "product_name", "category_name", "customer_segment", "order_region", "shipping_mode"]
ENGINEERED_NUMERIC = ["shipping_delay"]  # real - scheduled

NUMERIC_FEATURES = NUMERIC_BASE + ENGINEERED_NUMERIC
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL


def _normalize(name: str) -> str:
    return "".join(ch for ch in str(name).strip().lower() if ch.isalnum() or ch == " ").strip()


def _resolve(df_columns) -> dict[str, str]:
    """canonical -> source column name present in df (first alias match wins)."""
    norm_to_src = {_normalize(c): c for c in df_columns}
    resolved: dict[str, str] = {}
    for canon, aliases in _ALIASES.items():
        for a in aliases:
            na = _normalize(a)
            if na in norm_to_src:
                resolved[canon] = norm_to_src[na]
                break
    return resolved


def label_column(df_columns) -> str | None:
    norm_to_src = {_normalize(c): c for c in df_columns}
    for a in _LABEL_ALIASES:
        if _normalize(a) in norm_to_src:
            return norm_to_src[_normalize(a)]
    return None


def build_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series | None]:
    """Return (X, y). y is None when the label column is absent (scoring-only)."""
    resolved = _resolve(df.columns)
    X = pd.DataFrame(index=df.index)

    for canon in NUMERIC_BASE:
        src = resolved.get(canon)
        X[canon] = pd.to_numeric(df[src], errors="coerce") if src else pd.NA
    # Engineered: shipping delay (actual minus scheduled)
    X["shipping_delay"] = X["days_shipping_real"] - X["days_shipping_scheduled"]

    for canon in CATEGORICAL:
        src = resolved.get(canon)
        X[canon] = df[src].astype("string") if src else pd.Series(pd.NA, index=df.index, dtype="string")

    X = X[FEATURE_COLUMNS]

    y = None
    lbl = label_column(df.columns)
    if lbl is not None:
        y = (df[lbl].astype("string").str.upper() == SUSPECTED_FRAUD_VALUE).astype(int)

    return X, y


def feature_contract() -> dict:
    """Serializable description of the feature inputs (stored in model_meta.json)."""
    return {
        "numeric": NUMERIC_FEATURES,
        "categorical": CATEGORICAL,
        "all": FEATURE_COLUMNS,
        "label_rule": f"Order Status == '{SUSPECTED_FRAUD_VALUE}'",
        "excluded_to_prevent_leakage": ["order_id", "order_status", "order_date"],
    }
