"""Audit trail schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.audit import AuditEventType


class AuditEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: AuditEventType
    entity_type: str
    entity_id: str
    payload_hash: str
    chain_prev_hash: str | None
    chain_hash: str
    meta: dict | None
    created_at: datetime


class VerificationResult(BaseModel):
    event_id: int
    mode: str                       # development | fabric
    status: str                     # verified | failed | unavailable
    block_index: int | None = None
    chain_length: int | None = None
    checks: dict | None = None
    message: str
