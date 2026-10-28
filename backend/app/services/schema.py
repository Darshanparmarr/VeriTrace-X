"""Canonical VeriTrace-X dataset schema + DataCo column aliases.

The app analyzes supply-chain order-line records. Source files (e.g. the DataCo
Smart Supply Chain dataset) use their own column names, so we map a set of
*canonical* fields to accepted source aliases and suggest mappings for near-misses.

Fraud label: in DataCo, the fraud signal is `Order Status == "SUSPECTED_FRAUD"`.
This is a *suspected*-fraud label (dataset context), never confirmed fraud.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class CanonicalColumn:
    key: str                       # canonical name used internally
    label: str                     # human label
    dtype: str                     # "numeric" | "string" | "date"
    required: bool                 # blocks analysis if missing
    aliases: tuple[str, ...] = ()  # known source names (DataCo + common variants)
    note: str = ""


# Order matters for display. `required=True` columns are the minimum to run analysis.
CANONICAL_COLUMNS: list[CanonicalColumn] = [
    CanonicalColumn(
        "order_id", "Order ID", "string", True,
        ("order id", "order_id", "orderid", "order item id", "transaction id"),
    ),
    CanonicalColumn(
        "order_value", "Order value", "numeric", True,
        ("sales", "order value", "order_item_total", "order item total", "amount", "benefit per order"),
    ),
    CanonicalColumn(
        "product_name", "Product", "string", False,
        ("product name", "product", "item", "product card id"),
    ),
    CanonicalColumn(
        "category_name", "Category", "string", False,
        ("category name", "category", "department name"),
    ),
    CanonicalColumn(
        "customer_segment", "Customer segment", "string", False,
        ("customer segment", "segment", "market"),
    ),
    CanonicalColumn(
        "order_region", "Order region", "string", False,
        ("order region", "region", "order country", "order city"),
    ),
    CanonicalColumn(
        "shipping_mode", "Shipping mode", "string", False,
        ("shipping mode", "ship mode", "delivery status"),
    ),
    CanonicalColumn(
        "quantity", "Quantity", "numeric", False,
        ("order item quantity", "quantity", "qty"),
    ),
    CanonicalColumn(
        "discount_rate", "Discount rate", "numeric", False,
        ("order item discount rate", "discount rate", "discount"),
    ),
    CanonicalColumn(
        "days_shipping_real", "Days for shipping (real)", "numeric", False,
        ("days for shipping (real)", "days for shipping real", "shipping days"),
    ),
    CanonicalColumn(
        "days_shipping_scheduled", "Days for shipment (scheduled)", "numeric", False,
        ("days for shipment (scheduled)", "days for shipment scheduled", "scheduled days"),
    ),
    CanonicalColumn(
        "order_date", "Order date", "date", False,
        ("order date (dateorders)", "order date", "order_date", "date"),
    ),
    CanonicalColumn(
        "order_status", "Order status (fraud label source)", "string", False,
        ("order status", "order_status", "status"),
        note="Used to derive the suspected-fraud label (== SUSPECTED_FRAUD). "
             "Required to train/evaluate; optional for scoring only.",
    ),
]

CANONICAL_BY_KEY: dict[str, CanonicalColumn] = {c.key: c for c in CANONICAL_COLUMNS}
REQUIRED_KEYS: list[str] = [c.key for c in CANONICAL_COLUMNS if c.required]

# The dataset value in `order_status` that marks a suspected-fraud order.
SUSPECTED_FRAUD_VALUE = "SUSPECTED_FRAUD"


def normalize(name: str) -> str:
    """Lowercase, collapse separators — for alias matching."""
    return "".join(ch for ch in name.strip().lower() if ch.isalnum() or ch == " ").strip()


# Precomputed: normalized alias -> canonical key
_ALIAS_INDEX: dict[str, str] = {}
for _c in CANONICAL_COLUMNS:
    _ALIAS_INDEX[normalize(_c.label)] = _c.key
    _ALIAS_INDEX[normalize(_c.key)] = _c.key
    for _a in _c.aliases:
        _ALIAS_INDEX[normalize(_a)] = _c.key


def exact_alias_match(source_col: str) -> str | None:
    """Return the canonical key for a source column via exact/alias match."""
    return _ALIAS_INDEX.get(normalize(source_col))


@dataclass
class MappingResult:
    mapping: dict[str, str] = field(default_factory=dict)       # source -> canonical
    suggested: dict[str, str] = field(default_factory=dict)     # source -> canonical (fuzzy)
    unmapped: list[str] = field(default_factory=list)


def resolve_columns(source_columns: list[str]) -> MappingResult:
    """Map source columns to canonical keys (exact aliases + fuzzy suggestions)."""
    import difflib

    result = MappingResult()
    taken: set[str] = set()
    alias_norms = list(_ALIAS_INDEX.keys())

    for col in source_columns:
        key = exact_alias_match(col)
        if key and key not in taken:
            result.mapping[col] = key
            taken.add(key)
            continue
        # Fuzzy: suggest the closest alias if reasonably similar.
        near = difflib.get_close_matches(normalize(col), alias_norms, n=1, cutoff=0.82)
        if near:
            cand = _ALIAS_INDEX[near[0]]
            if cand not in taken:
                result.suggested[col] = cand
                continue
        result.unmapped.append(col)

    return result
