"""Unit tests for parsing, validation, and export safety."""
from __future__ import annotations

import pandas as pd

from app.core.safe_export import sanitize_cell, to_csv
from app.services import dataset_validation as dv
from app.services.schema import exact_alias_match, resolve_columns


def test_alias_resolution():
    assert exact_alias_match("Order Id") == "order_id"
    assert exact_alias_match("Sales") == "order_value"
    assert exact_alias_match("Product Name") == "product_name"
    assert exact_alias_match("totally unknown") is None


def test_fuzzy_suggestion():
    res = resolve_columns(["Order Idx", "Saless"])
    # Near-misses should be suggested, not silently mapped.
    assert res.suggested or res.unmapped


def test_build_report_flags_non_numeric():
    df = pd.DataFrame({"Order Id": ["A", "B"], "Sales": ["10", "notnum"]})
    report = dv.build_report(df)
    assert report.is_valid is True  # required cols present
    assert any(i.issue == "non_numeric" for i in report.issues)


def test_build_report_duplicates_warning():
    df = pd.DataFrame({"Order Id": ["A", "A"], "Sales": [1, 1]})
    report = dv.build_report(df)
    assert report.duplicate_rows == 1
    assert any("duplicate" in w.lower() for w in report.warnings)


def test_malformed_csv_rows_reported_not_dropped_silently():
    # Row 2 has an extra field.
    data = b"Order Id,Sales\nA,10\nB,20,EXTRA\nC,30\n"
    df, warnings = dv.read_tabular(data, "x.csv")
    assert any("malformed" in w.lower() for w in warnings)


def test_formula_injection_neutralised():
    assert sanitize_cell("=SUM(A1:A9)").startswith("'=")
    assert sanitize_cell("+1").startswith("'+")
    assert sanitize_cell("normal") == "normal"
    csv = to_csv([{"a": "=cmd"}], ["a"])
    assert "'=cmd" in csv
