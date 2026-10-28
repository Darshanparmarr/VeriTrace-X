"""Human review schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.transaction import ReviewStatus


class ReviewDecisionCreate(BaseModel):
    decision: ReviewStatus
    reason: str | None = None
    evidence_ref: str | None = None


class ReviewDecisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    decision: ReviewStatus
    reason: str | None
    evidence_ref: str | None
    actor_name: str | None = None
    created_at: datetime


class ReviewCaseOut(BaseModel):
    transaction_id: int
    status: ReviewStatus
    decisions: list[ReviewDecisionOut]
