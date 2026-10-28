"""Generate a small, synthetic DataCo-shaped sample dataset.

Deterministic (seeded) and clearly synthetic — used for the downloadable template,
example dataset, and tests. It is NOT real data and carries no real fraud labels.
"""
from __future__ import annotations

import random

from app.core.safe_export import to_csv

# Column headers match the DataCo source names so mapping resolves cleanly.
HEADERS = [
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

_PRODUCTS = ["Industrial Sensor Kit", "Thermal Camera", "Hydraulic Valve", "Circuit Board", "Cold-chain Unit"]
_CATEGORIES = ["Electronics", "Industrial", "Components", "Logistics"]
_SEGMENTS = ["Consumer", "Corporate", "Home Office"]
_REGIONS = ["West of USA", "Western Europe", "South Asia", "Central America"]
_MODES = ["Standard Class", "Second Class", "First Class", "Same Day"]
_STATUSES = ["COMPLETE", "PENDING", "PROCESSING", "CLOSED"]


def generate_rows(n: int = 50, seed: int = 42) -> list[dict]:
    rng = random.Random(seed)
    rows: list[dict] = []
    for i in range(n):
        qty = rng.randint(1, 20)
        sched = rng.randint(1, 6)
        real = max(1, sched + rng.randint(-1, 4))
        # ~2% of synthetic rows carry the suspected-fraud marker (illustrative only).
        is_fraud = rng.random() < 0.02
        status = "SUSPECTED_FRAUD" if is_fraud else rng.choice(_STATUSES)
        # Mirror DataCo: suspected fraud only on TRANSFER payments.
        payment_type = "TRANSFER" if is_fraud else rng.choice(["CASH", "DEBIT", "PAYMENT", "TRANSFER"])
        rows.append(
            {
                "Order Id": f"VX-{1000 + i}",
                "Type": payment_type,
                "order date (DateOrders)": f"2024-{rng.randint(1,12):02d}-{rng.randint(1,28):02d}",
                "Product Name": rng.choice(_PRODUCTS),
                "Category Name": rng.choice(_CATEGORIES),
                "Customer Segment": rng.choice(_SEGMENTS),
                "Order Region": rng.choice(_REGIONS),
                "Shipping Mode": rng.choice(_MODES),
                "Order Item Quantity": qty,
                "Order Item Discount Rate": round(rng.uniform(0, 0.25), 2),
                "Days for shipping (real)": real,
                "Days for shipment (scheduled)": sched,
                "Sales": round(rng.uniform(50, 50000), 2),
                "Order Status": status,
            }
        )
    return rows


def sample_csv(n: int = 50) -> str:
    return to_csv(generate_rows(n), HEADERS)


def template_csv() -> str:
    """Header row + 3 example rows, for users to fill in."""
    return to_csv(generate_rows(3), HEADERS)
