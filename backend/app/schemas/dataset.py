"""Dataset & validation schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.dataset import DatasetStatus


class ColumnIssue(BaseModel):
    column: str
    issue: str          # e.g. "missing", "non_numeric", "unmapped"
    count: int = 0
    detail: str | None = None


class ValidationReport(BaseModel):
    row_count: int
    column_count: int
    columns: list[str]
    required_present: list[str]
    required_missing: list[str]
    # Suggested source->canonical mapping for near-miss column names.
    suggested_mapping: dict[str, str]
    duplicate_rows: int
    missing_values: dict[str, int]
    issues: list[ColumnIssue]
    warnings: list[str]
    is_valid: bool          # no blocking errors (missing required columns)


class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    row_count: int
    column_count: int
    status: DatasetStatus
    created_at: datetime


class DatasetDetail(DatasetOut):
    validation_report: ValidationReport | None = None


class PreviewRow(BaseModel):
    values: dict


class UploadResponse(BaseModel):
    dataset: DatasetOut
    validation: ValidationReport
    preview: list[dict]     # first N rows for the UI preview
