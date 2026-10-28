"""Dashboard summary schema."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.analysis import TransactionOut


class BlockchainStatus(BaseModel):
    mode: str
    status: str  # online | degraded | unavailable


class RiskBandCount(BaseModel):
    band: str
    count: int


class ScoreBucket(BaseModel):
    bucket: str   # e.g. "0.0–0.1"
    count: int


class ReviewActivity(BaseModel):
    transaction_id: int
    order_id: str
    decision: str
    actor_name: str | None
    created_at: datetime


class DashboardSummary(BaseModel):
    # True when no real analysis has run yet and figures are seeded/empty.
    is_demo: bool
    analyzed: int
    requires_review: int
    high_risk: int
    reviewed: int
    risk_distribution: list[RiskBandCount]
    score_histogram: list[ScoreBucket]
    recent_transactions: list[TransactionOut]
    recent_reviews: list[ReviewActivity]
    model_status: str          # not_trained | active
    data_freshness: str | None
    blockchain: BlockchainStatus
    # Research context (DataCo) — not a validated model metric.
    suspected_fraud_rate: float | None = None
