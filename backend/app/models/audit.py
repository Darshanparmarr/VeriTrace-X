"""Audit event and blockchain reference models.

In development mode, audit events form a local hash-chain (each event stores the
previous event's hash) — tamper-evident but explicitly NOT a real blockchain.
In fabric mode, a BlockchainReference records the real on-chain transaction.
"""
from __future__ import annotations

import enum

from sqlalchemy import Boolean, Enum, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class AuditEventType(str, enum.Enum):
    analysis_completed = "analysis_completed"
    review_decision_recorded = "review_decision_recorded"
    case_escalated = "case_escalated"
    audit_event_verified = "audit_event_verified"


class AuditEvent(TimestampMixin, Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[AuditEventType] = mapped_column(
        Enum(AuditEventType, native_enum=False, length=40), nullable=False
    )
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Only a hash of the payload is stored for integrity — not sensitive data.
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    # Local hash-chain links (dev-mode tamper-evidence).
    chain_prev_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    chain_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    blockchain_ref = relationship(
        "BlockchainReference", back_populates="audit_event", uselist=False,
        cascade="all, delete-orphan",
    )


class BlockchainRefStatus(str, enum.Enum):
    unavailable = "unavailable"   # dev mode — not anchored to a real ledger
    pending = "pending"
    anchored = "anchored"
    verified = "verified"
    failed = "failed"


class BlockchainReference(TimestampMixin, Base):
    __tablename__ = "blockchain_references"

    id: Mapped[int] = mapped_column(primary_key=True)
    audit_event_id: Mapped[int] = mapped_column(
        ForeignKey("audit_events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    mode: Mapped[str] = mapped_column(String(20), nullable=False)  # development | fabric
    tx_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    block: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[BlockchainRefStatus] = mapped_column(
        Enum(BlockchainRefStatus, native_enum=False, length=20),
        default=BlockchainRefStatus.unavailable,
        nullable=False,
    )

    audit_event = relationship("AuditEvent", back_populates="blockchain_ref")
