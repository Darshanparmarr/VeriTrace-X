"""Model version, prediction, and explanation models."""
from __future__ import annotations

import enum

from sqlalchemy import Boolean, Enum, Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class ModelVersion(TimestampMixin, Base):
    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(60), nullable=False)
    version: Mapped[str] = mapped_column(String(40), nullable=False)
    artifact_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Measured evaluation metrics (precision/recall/f1/roc_auc/pr_auc/confusion...).
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Prediction(TimestampMixin, Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    model_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("model_versions.id", ondelete="SET NULL"), nullable=True
    )
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    band: Mapped[str | None] = mapped_column(String(12), nullable=True)

    model_version = relationship("ModelVersion")


class ExplanationMethod(str, enum.Enum):
    shap = "shap"
    lime = "lime"


class Explanation(TimestampMixin, Base):
    __tablename__ = "explanations"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    method: Mapped[ExplanationMethod] = mapped_column(
        Enum(ExplanationMethod, native_enum=False, length=10), nullable=False
    )
    # Feature contributions + plain-English summary.
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
