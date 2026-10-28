"""Dashboard summary endpoint — derives figures from real stored results."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.ml.predictor import predictor
from app.models.review import ReviewDecision
from app.models.transaction import RiskBand, ReviewStatus, Transaction
from app.models.user import User
from app.schemas.analysis import TransactionOut
from app.schemas.dashboard import (
    BlockchainStatus,
    DashboardSummary,
    ReviewActivity,
    RiskBandCount,
    ScoreBucket,
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

    # Score histogram (10 bins) — a real distribution, computed in Python for portability.
    histogram = _score_histogram(db)

    # Recent suspicious transactions (highest risk, still awaiting review).
    recent_tx = db.scalars(
        select(Transaction)
        .where(Transaction.review_status.in_([ReviewStatus.new, ReviewStatus.under_review]))
        .order_by(Transaction.risk_score.desc().nullslast())
        .limit(6)
    ).all()

    # Recent review activity.
    recent_reviews = _recent_reviews(db)

    return DashboardSummary(
        is_demo=total == 0,  # no real analysis yet -> frontend shows an empty state
        analyzed=int(total),
        requires_review=int(requires_review),
        high_risk=int(high_risk),
        reviewed=int(reviewed),
        risk_distribution=distribution,
        score_histogram=histogram,
        recent_transactions=[TransactionOut.model_validate(t) for t in recent_tx],
        recent_reviews=recent_reviews,
        model_status=predictor.status()["status"],
        data_freshness=None,
        blockchain=BlockchainStatus(mode=settings.blockchain_mode, status="unavailable"),
        suspected_fraud_rate=0.0225,  # DataCo research context, not a model metric
    )


def _score_histogram(db: Session) -> list[ScoreBucket]:
    buckets = [0] * 10
    scores = db.scalars(select(Transaction.risk_score).where(Transaction.risk_score.isnot(None)))
    for s in scores:
        idx = min(int(float(s) * 10), 9)
        buckets[idx] += 1
    return [
        ScoreBucket(bucket=f"{i/10:.1f}–{(i+1)/10:.1f}", count=c)
        for i, c in enumerate(buckets)
    ]


def _recent_reviews(db: Session) -> list[ReviewActivity]:
    from app.models.review import ReviewCase
    from app.models.user import User as UserModel

    rows = db.execute(
        select(ReviewDecision, Transaction.order_id, Transaction.id, UserModel.full_name)
        .join(ReviewCase, ReviewCase.id == ReviewDecision.case_id)
        .join(Transaction, Transaction.id == ReviewCase.transaction_id)
        .outerjoin(UserModel, UserModel.id == ReviewDecision.actor_id)
        .order_by(ReviewDecision.created_at.desc(), ReviewDecision.id.desc())
        .limit(6)
    ).all()
    return [
        ReviewActivity(
            transaction_id=tid,
            order_id=order_id,
            decision=dec.decision.value,
            actor_name=actor_name,
            created_at=dec.created_at,
        )
        for dec, order_id, tid, actor_name in rows
    ]
