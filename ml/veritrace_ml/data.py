"""Dataset loading: real DataCo CSV if present, else a synthetic fallback.

The synthetic generator emits the SAME source column names as DataCo and injects a
genuine (but noisy) relationship between features and the suspected-fraud label, so
trained models produce meaningful, non-degenerate metrics. It is clearly synthetic.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"

# Source column names (match DataCo so real-data retrain is a drop-in).
COLUMNS = [
    "Order Id",
    "Type",
    "order date (DateOrders)",
    "Product Name",
    "Category Name",
    "Customer Segment",
    "Order Region",
    "Shipping Mode",
    "Order Item Quantity",
    "Order Item Discount Rate",
    "Days for shipping (real)",
    "Days for shipment (scheduled)",
    "Sales",
    "Order Status",
]

_PRODUCTS = ["Industrial Sensor Kit", "Thermal Camera", "Hydraulic Valve", "Circuit Board", "Cold-chain Unit", "Fastener Pack"]
_CATEGORIES = ["Electronics", "Industrial", "Components", "Logistics", "Safety"]
_SEGMENTS = ["Consumer", "Corporate", "Home Office"]
_REGIONS = ["West of USA", "Western Europe", "South Asia", "Central America", "East of USA"]
_MODES = ["Standard Class", "Second Class", "First Class", "Same Day"]
_NONFRAUD_STATUS = ["COMPLETE", "PENDING", "PROCESSING", "CLOSED"]


def load_dataset(raw_dir: Path = RAW_DIR) -> tuple[pd.DataFrame, str]:
    """Return (df, source) where source is 'dataco' or 'synthetic'."""
    raw_dir = Path(raw_dir)
    if raw_dir.exists():
        csvs = sorted([p for p in raw_dir.glob("*.csv")] + [p for p in raw_dir.glob("*.xlsx")])
        if csvs:
            path = csvs[0]
            if path.suffix.lower() == ".csv":
                try:
                    df = pd.read_csv(path, encoding="latin-1", low_memory=False)
                except Exception:
                    df = pd.read_csv(path, low_memory=False)
            else:
                df = pd.read_excel(path)
            return df, "dataco"
    return generate_synthetic(), "synthetic"


def generate_synthetic(n: int = 12000, seed: int = 42) -> pd.DataFrame:
    """Synthetic order-lines with a real (noisy) fraud signal, ~3% positive."""
    rng = np.random.default_rng(seed)

    sales = np.round(rng.gamma(2.0, 3000, n) + 50, 2)
    quantity = rng.integers(1, 25, n)
    discount = np.round(rng.beta(2, 8, n) * 0.5, 3)  # 0..~0.5, skewed low
    scheduled = rng.integers(1, 7, n)
    real = np.clip(scheduled + rng.integers(-1, 6, n), 1, None)
    delay = real - scheduled

    segment = rng.choice(_SEGMENTS, n, p=[0.5, 0.35, 0.15])
    region = rng.choice(_REGIONS, n)
    mode = rng.choice(_MODES, n, p=[0.5, 0.25, 0.15, 0.10])
    product = rng.choice(_PRODUCTS, n)
    category = rng.choice(_CATEGORIES, n)

    # Latent fraud risk: high value + high discount + shipping anomaly + same-day on big orders.
    z = (
        -4.2
        + 1.1 * (sales > np.quantile(sales, 0.9))
        + 1.4 * (discount > 0.3)
        + 0.9 * (delay >= 4)
        + 0.8 * ((mode == "Same Day") & (sales > np.quantile(sales, 0.75)))
        + 0.5 * (segment == "Consumer")
        + rng.normal(0, 0.6, n)  # irreducible noise -> non-perfect metrics
    )
    p = 1 / (1 + np.exp(-z))
    is_fraud = rng.random(n) < p

    status = np.where(
        is_fraud,
        "SUSPECTED_FRAUD",
        rng.choice(_NONFRAUD_STATUS, n),
    )
    # Mirror DataCo: suspected fraud only occurs on TRANSFER payments.
    payment_type = np.where(
        is_fraud, "TRANSFER", rng.choice(["CASH", "DEBIT", "PAYMENT", "TRANSFER"], n)
    )

    months = rng.integers(1, 13, n)
    days = rng.integers(1, 28, n)

    return pd.DataFrame(
        {
            "Order Id": [f"VX-{100000 + i}" for i in range(n)],
            "Type": payment_type,
            "order date (DateOrders)": [f"2024-{m:02d}-{d:02d}" for m, d in zip(months, days)],
            "Product Name": product,
            "Category Name": category,
            "Customer Segment": segment,
            "Order Region": region,
            "Shipping Mode": mode,
            "Order Item Quantity": quantity,
            "Order Item Discount Rate": discount,
            "Days for shipping (real)": real,
            "Days for shipment (scheduled)": scheduled,
            "Sales": sales,
            "Order Status": status,
        },
        columns=COLUMNS,
    )
