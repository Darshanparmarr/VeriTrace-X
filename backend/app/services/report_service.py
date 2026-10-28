"""Reporting: summaries and safe CSV exports from real stored results."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.safe_export import to_csv
from app.ml.predictor import predictor
from app.models.review import ReviewCase, ReviewDecision
from app.models.transaction import RiskBand, ReviewStatus, Transaction
from app.models.user import User


def summary(db: Session) -> dict:
    total = db.scalar(select(func.count()).select_from(Transaction)) or 0

    band_rows = db.execute(
        select(Transaction.risk_band, func.count()).group_by(Transaction.risk_band)
    ).all()
    by_band = {b.value: 0 for b in (RiskBand.low, RiskBand.medium, RiskBand.high, RiskBand.critical)}
    for band, count in band_rows:
        by_band[band.value] = int(count)

    status_rows = db.execute(
        select(Transaction.review_status, func.count()).group_by(Transaction.review_status)
    ).all()
    by_status = {s.value: 0 for s in ReviewStatus}
    for st, count in status_rows:
        by_status[st.value] = int(count)

    avg_score = db.scalar(select(func.avg(Transaction.risk_score)))
    meta = predictor.meta or {}
    model_metrics = (meta.get("metrics", {}) or {}).get("selected", {})

    return {
        "total_transactions": int(total),
        "risk_distribution": by_band,
        "review_outcomes": by_status,
        "flagged": by_band["high"] + by_band["critical"],
        "average_risk_score": float(avg_score) if avg_score is not None else None,
        "model": {
            "status": predictor.status()["status"],
            "algorithm": meta.get("algorithm"),
            "version": meta.get("version"),
            "data_source": meta.get("data_source"),
            "is_synthetic": meta.get("is_synthetic", False),
            "test_metrics": model_metrics.get("test"),
        },
    }


_TX_FIELDS = [
    "order_id", "supplier", "product", "location", "order_value",
    "risk_score", "risk_band", "review_status", "analysis_id", "created_at",
]


def transactions_csv(db: Session, risk: RiskBand | None = None, analysis_id: int | None = None) -> str:
    stmt = select(Transaction)
    if risk is not None:
        stmt = stmt.where(Transaction.risk_band == risk)
    if analysis_id is not None:
        stmt = stmt.where(Transaction.analysis_id == analysis_id)
    stmt = stmt.order_by(Transaction.risk_score.desc().nullslast())

    rows = []
    for t in db.scalars(stmt):
        rows.append(
            {
                "order_id": t.order_id,
                "supplier": t.supplier,
                "product": t.product,
                "location": t.location,
                "order_value": t.order_value,
                "risk_score": None if t.risk_score is None else round(t.risk_score, 6),
                "risk_band": t.risk_band.value,
                "review_status": t.review_status.value,
                "analysis_id": t.analysis_id,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
        )
    return to_csv(rows, _TX_FIELDS)


_REVIEW_FIELDS = ["transaction_order_id", "decision", "reason", "evidence_ref", "actor", "created_at"]


def reviews_csv(db: Session) -> str:
    rows_q = db.execute(
        select(ReviewDecision, Transaction.order_id, User.full_name)
        .join(ReviewCase, ReviewCase.id == ReviewDecision.case_id)
        .join(Transaction, Transaction.id == ReviewCase.transaction_id)
        .outerjoin(User, User.id == ReviewDecision.actor_id)
        .order_by(ReviewDecision.created_at.desc())
    ).all()
    rows = []
    for dec, order_id, actor in rows_q:
        rows.append(
            {
                "transaction_order_id": order_id,
                "decision": dec.decision.value,
                "reason": dec.reason,
                "evidence_ref": dec.evidence_ref,
                "actor": actor,
                "created_at": dec.created_at.isoformat() if dec.created_at else None,
            }
        )
    return to_csv(rows, _REVIEW_FIELDS)
