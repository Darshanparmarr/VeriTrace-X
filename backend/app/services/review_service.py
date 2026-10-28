"""Human review workflow.

A model prediction NEVER auto-confirms fraud — confirming fraud (or escalating) is
an explicit human action that REQUIRES a reason. History is preserved: every decision
is an immutable row; the transaction's current status reflects the latest decision.
"""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.review import ReviewCase, ReviewDecision
from app.models.transaction import ReviewStatus, Transaction
from app.models.user import User

# Decisions that materially change the case and therefore require a written reason.
_REASON_REQUIRED = {ReviewStatus.escalated, ReviewStatus.confirmed_fraud}


def get_or_create_case(db: Session, transaction: Transaction) -> ReviewCase:
    case = db.scalar(select(ReviewCase).where(ReviewCase.transaction_id == transaction.id))
    if case is None:
        case = ReviewCase(transaction_id=transaction.id, status=transaction.review_status)
        db.add(case)
        db.flush()
    return case


def record_decision(
    db: Session,
    transaction: Transaction,
    user: User,
    decision: ReviewStatus,
    reason: str | None,
    evidence_ref: str | None,
) -> ReviewCase:
    if decision in _REASON_REQUIRED and not (reason and reason.strip()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"A reason is required to record '{decision.value}'.",
        )

    case = get_or_create_case(db, transaction)
    db.add(
        ReviewDecision(
            case_id=case.id,
            actor_id=user.id,
            decision=decision,
            reason=reason.strip() if reason else None,
            evidence_ref=evidence_ref.strip() if evidence_ref else None,
        )
    )
    # Current status reflects the latest decision (history is preserved as rows).
    case.status = decision
    transaction.review_status = decision
    db.commit()
    db.refresh(case)
    return case


def decisions_with_actors(db: Session, case: ReviewCase) -> list[dict]:
    """Return decisions (newest first) annotated with the actor's name."""
    rows = db.execute(
        select(ReviewDecision, User.full_name)
        .outerjoin(User, User.id == ReviewDecision.actor_id)
        .where(ReviewDecision.case_id == case.id)
        .order_by(ReviewDecision.created_at.desc(), ReviewDecision.id.desc())
    ).all()
    out = []
    for decision, actor_name in rows:
        out.append(
            {
                "id": decision.id,
                "decision": decision.decision,
                "reason": decision.reason,
                "evidence_ref": decision.evidence_ref,
                "actor_name": actor_name,
                "created_at": decision.created_at,
            }
        )
    return out


def get_case(db: Session, transaction_id: int) -> ReviewCase | None:
    return db.scalar(select(ReviewCase).where(ReviewCase.transaction_id == transaction_id))
