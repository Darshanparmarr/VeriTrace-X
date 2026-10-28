"""Parse and validate uploaded CSV/Excel order data into a ValidationReport.

Safety: malformed rows are reported (never silently dropped); the original file is
never mutated. Formula-injection neutralisation is applied on export, not import.
"""
from __future__ import annotations

import io

import numpy as np
import pandas as pd

from app.schemas.dataset import ColumnIssue, ValidationReport
from app.services.schema import (
    CANONICAL_BY_KEY,
    REQUIRED_KEYS,
    resolve_columns,
)

PREVIEW_ROWS = 20
_CSV_EXT = (".csv", ".txt", ".tsv")
_XLSX_EXT = (".xlsx", ".xls")


class DataParseError(Exception):
    """Raised when a file cannot be parsed into a table."""


def read_tabular(data: bytes, filename: str) -> tuple[pd.DataFrame, list[str]]:
    """Read bytes into a DataFrame. Returns (df, warnings).

    Malformed CSV lines are skipped but COUNTED and reported as a warning.
    """
    name = (filename or "").lower()
    warnings: list[str] = []

    if name.endswith(_XLSX_EXT):
        try:
            df = pd.read_excel(io.BytesIO(data))
        except Exception as exc:  # openpyxl / xlrd errors
            raise DataParseError(f"Could not read the spreadsheet: {exc}") from exc
        return _finalize(df), warnings

    if name.endswith(_CSV_EXT) or not name:
        sep = "\t" if name.endswith(".tsv") else ","
        try:
            text = data.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = data.decode("latin-1")
            warnings.append("File was not UTF-8; decoded as latin-1. Check special characters.")

        # Count non-empty data lines to detect silently-skipped malformed rows.
        raw_lines = [ln for ln in text.splitlines() if ln.strip()]
        expected_rows = max(len(raw_lines) - 1, 0)

        try:
            df = pd.read_csv(io.StringIO(text), sep=sep, on_bad_lines="skip", engine="python")
        except Exception as exc:
            raise DataParseError(f"Could not parse the CSV: {exc}") from exc

        skipped = expected_rows - len(df)
        if skipped > 0:
            warnings.append(
                f"{skipped} malformed row(s) could not be parsed and were excluded. "
                "Fix these rows and re-upload — they were not analyzed."
            )
        return _finalize(df), warnings

    raise DataParseError(
        f"Unsupported file type '{filename}'. Please upload a .csv or .xlsx file."
    )


def _finalize(df: pd.DataFrame) -> pd.DataFrame:
    # Drop fully-empty trailing columns/rows pandas sometimes adds; strip header spaces.
    df = df.dropna(axis=1, how="all")
    df.columns = [str(c).strip() for c in df.columns]
    return df


def build_report(df: pd.DataFrame, extra_warnings: list[str] | None = None) -> ValidationReport:
    """Validate a parsed DataFrame against the canonical schema."""
    warnings = list(extra_warnings or [])
    issues: list[ColumnIssue] = []
    source_cols = list(df.columns)

    mapping = resolve_columns(source_cols)
    mapped_keys = set(mapping.mapping.values())

    required_present = [k for k in REQUIRED_KEYS if k in mapped_keys]
    required_missing = [k for k in REQUIRED_KEYS if k not in mapped_keys]

    # Recommended (non-required) canonical fields that are absent -> warnings.
    for key, col in CANONICAL_BY_KEY.items():
        if not col.required and key not in mapped_keys and key not in mapping.suggested.values():
            warnings.append(f"Recommended column '{col.label}' not found — analysis may be less accurate.")

    # Missing values per source column.
    missing_values: dict[str, int] = {}
    for col in source_cols:
        n = int(df[col].isna().sum())
        if n:
            missing_values[col] = n

    # Duplicate full rows.
    duplicate_rows = int(df.duplicated().sum())
    if duplicate_rows:
        warnings.append(f"{duplicate_rows} duplicate row(s) detected. Review before analysis.")

    # Type checks on mapped numeric columns.
    for src, key in mapping.mapping.items():
        canon = CANONICAL_BY_KEY[key]
        if canon.dtype == "numeric":
            coerced = pd.to_numeric(df[src], errors="coerce")
            bad = int(coerced.isna().sum() - df[src].isna().sum())
            if bad > 0:
                issues.append(
                    ColumnIssue(
                        column=src,
                        issue="non_numeric",
                        count=bad,
                        detail=f"{bad} value(s) in '{src}' are not numeric but '{canon.label}' expects numbers.",
                    )
                )

    for key in required_missing:
        canon = CANONICAL_BY_KEY[key]
        issues.append(
            ColumnIssue(
                column=canon.label,
                issue="missing_required",
                detail=f"Required column '{canon.label}' was not found. "
                "Map an existing column to it, or add it to your file.",
            )
        )

    return ValidationReport(
        row_count=int(len(df)),
        column_count=int(len(source_cols)),
        columns=source_cols,
        required_present=required_present,
        required_missing=required_missing,
        suggested_mapping=mapping.suggested,
        duplicate_rows=duplicate_rows,
        missing_values=missing_values,
        issues=issues,
        warnings=warnings,
        is_valid=len(required_missing) == 0,
    )


def preview_records(df: pd.DataFrame, n: int = PREVIEW_ROWS) -> list[dict]:
    """First N rows as JSON-safe dicts for the UI preview."""
    head = df.head(n).replace({np.nan: None})
    records: list[dict] = []
    for _, row in head.iterrows():
        records.append({str(k): _jsonable(v) for k, v in row.items()})
    return records


def _jsonable(v):
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    return v if isinstance(v, (int, float, str, bool)) else str(v)
