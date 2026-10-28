"""Uploaded dataset model."""
from __future__ import annotations

import enum

from sqlalchemy import Enum, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class DatasetStatus(str, enum.Enum):
    uploaded = "uploaded"        # stored, not yet validated
    validated = "validated"      # passed validation, ready to analyze
    invalid = "invalid"          # validation found blocking errors
    analyzed = "analyzed"        # an analysis job has run


class Dataset(TimestampMixin, Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    content_hash: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)

    row_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    column_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    status: Mapped[DatasetStatus] = mapped_column(
        Enum(DatasetStatus, native_enum=False, length=20),
        default=DatasetStatus.uploaded,
        nullable=False,
    )
    # Full validation report (missing values, duplicates, type issues, mapping hints).
    validation_report: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    uploaded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    uploaded_by = relationship("User")
