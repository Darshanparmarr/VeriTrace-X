"""Scored transaction model."""
from __future__ import annotations

import enum

from sqlalchemy import Enum, Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class RiskBand(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"
    unknown = "unknown"


class ReviewStatus(str, enum.Enum):
    new = "new"
    under_review = "under_review"
    legitimate = "legitimate"
    escalated = "escalated"
    confirmed_fraud = "confirmed_fraud"


class Transaction(TimestampMixin, Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int | None] = mapped_column(
        ForeignKey("analysis_jobs.id", ondelete="CASCADE"), nullable=True, index=True
    )
    # Business key from the source data (e.g. DataCo "Order Id").
    order_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    supplier: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    order_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Model output — nullable so an "unavailable" prediction is representable.
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_band: Mapped[RiskBand] = mapped_column(
        Enum(RiskBand, native_enum=False, length=12), default=RiskBand.unknown, nullable=False
    )
    review_status: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus, native_enum=False, length=20),
        default=ReviewStatus.new,
        nullable=False,
    )

    # The subset of source fields the model considered (kept for investigation).
    features: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    analysis = relationship("AnalysisJob")
