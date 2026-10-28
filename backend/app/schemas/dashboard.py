"""Dashboard summary schema."""
from __future__ import annotations

from pydantic import BaseModel


class BlockchainStatus(BaseModel):
    mode: str
    status: str  # online | degraded | unavailable


class RiskBandCount(BaseModel):
    band: str
    count: int


class DashboardSummary(BaseModel):
    # True when no real analysis has run yet and figures are seeded/empty.
    is_demo: bool
    analyzed: int
    requires_review: int
    high_risk: int
    reviewed: int
    risk_distribution: list[RiskBandCount]
    model_status: str          # not_trained | active
    data_freshness: str | None
    blockchain: BlockchainStatus
    # Research context (DataCo) — not a validated model metric.
    suspected_fraud_rate: float | None = None
