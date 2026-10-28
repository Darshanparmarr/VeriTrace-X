"""Human review case and decision models."""
from __future__ import annotations

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.transaction import ReviewStatus


class ReviewCase(TimestampMixin, Base):
    __tablename__ = "review_cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus, native_enum=False, length=20),
        default=ReviewStatus.new,
        nullable=False,
    )
    assigned_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    decisions = relationship(
        "ReviewDecision", back_populates="case", cascade="all, delete-orphan"
    )


class ReviewDecision(TimestampMixin, Base):
    __tablename__ = "review_decisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(
        ForeignKey("review_cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # The decision recorded (maps to ReviewStatus values).
    decision: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus, native_enum=False, length=20), nullable=False
    )
    # A reason is required for consequential decisions (enforced in the service layer).
    reason: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    evidence_ref: Mapped[str | None] = mapped_column(String(512), nullable=True)

    case = relationship("ReviewCase", back_populates="decisions")
