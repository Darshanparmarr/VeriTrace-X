"""Dashboard summary endpoint — derives figures from real stored results."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.transaction import RiskBand, ReviewStatus, Transaction
from app.models.user import User
from app.schemas.dashboard import (
    BlockchainStatus,
    DashboardSummary,
    RiskBandCount,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DashboardSummary:
    total = db.scalar(select(func.count()).select_from(Transaction)) or 0

    # Risk-band distribution from real rows.
    band_rows = db.execute(
        select(Transaction.risk_band, func.count()).group_by(Transaction.risk_band)
    ).all()
    band_counts = {band: count for band, count in band_rows}
    distribution = [
        RiskBandCount(band=b.value, count=int(band_counts.get(b, 0)))
        for b in (RiskBand.low, RiskBand.medium, RiskBand.high, RiskBand.critical)
    ]

    high_risk = int(band_counts.get(RiskBand.critical, 0)) + int(band_counts.get(RiskBand.high, 0))

    requires_review = db.scalar(
        select(func.count()).select_from(Transaction).where(
            Transaction.review_status.in_([ReviewStatus.new, ReviewStatus.under_review])
        )
    ) or 0
    reviewed = db.scalar(
        select(func.count()).select_from(Transaction).where(
            Transaction.review_status.in_(
                [ReviewStatus.legitimate, ReviewStatus.escalated, ReviewStatus.confirmed_fraud]
            )
        )
    ) or 0

    return DashboardSummary(
        is_demo=total == 0,  # no real analysis yet -> frontend shows demo labelling
        analyzed=int(total),
        requires_review=int(requires_review),
        high_risk=int(high_risk),
        reviewed=int(reviewed),
        risk_distribution=distribution,
        model_status="not_trained",  # Phase 3 sets this to "active"
        data_freshness=None,
        blockchain=BlockchainStatus(mode=settings.blockchain_mode, status="unavailable"),
        suspected_fraud_rate=0.0225,  # DataCo research context, not a model metric
    )
