"""CSV/Excel export safety — neutralise spreadsheet formula injection.

A cell beginning with = + - @ (or tab/CR) can execute when opened in Excel/Sheets.
We prefix such values with a single quote so they render as text.
"""
from __future__ import annotations

import csv
import io

_DANGEROUS_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def sanitize_cell(value) -> str:
    s = "" if value is None else str(value)
    if s and s[0] in _DANGEROUS_PREFIXES:
        return "'" + s
    return s


def to_csv(rows: list[dict], fieldnames: list[str]) -> str:
    """Serialize rows to a CSV string with formula-injection neutralisation."""
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({k: sanitize_cell(row.get(k)) for k in fieldnames})
    return buf.getvalue()
