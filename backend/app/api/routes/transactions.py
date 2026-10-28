"""Transaction listing, detail, and explanation endpoints."""
from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.ml.predictor import predictor
from app.models.transaction import RiskBand, ReviewStatus, Transaction
from app.models.user import User
from app.schemas.analysis import ExplanationOut, TransactionDetail, TransactionOut
from app.schemas.common import Page

router = APIRouter(prefix="/transactions", tags=["transactions"])

_EXPLAIN_NOTE = (
    "Feature contributions describe the model's reasoning (SHAP influence/correlation) — "
    "they are not causal proof of fraud."
)


@router.get("", response_model=Page[TransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    analysis_id: int | None = None,
    risk: RiskBand | None = None,
    review_status: ReviewStatus | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
) -> Page[TransactionOut]:
    stmt = select(Transaction)
    count_stmt = select(func.count()).select_from(Transaction)

    conditions = []
    if analysis_id is not None:
        conditions.append(Transaction.analysis_id == analysis_id)
    if risk is not None:
        conditions.append(Transaction.risk_band == risk)
    if review_status is not None:
        conditions.append(Transaction.review_status == review_status)
    if q:
        like = f"%{q.strip()}%"
        conditions.append(
            or_(
                Transaction.order_id.ilike(like),
                Transaction.supplier.ilike(like),
                Transaction.product.ilike(like),
            )
        )
    for c in conditions:
        stmt = stmt.where(c)
        count_stmt = count_stmt.where(c)

    total = db.scalar(count_stmt) or 0
    rows = db.scalars(
        stmt.order_by(Transaction.risk_score.desc().nullslast())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return Page(
        items=[TransactionOut.model_validate(r) for r in rows],
        total=int(total),
        page=page,
        page_size=page_size,
    )


@router.get("/{transaction_id}", response_model=TransactionDetail)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TransactionDetail:
    tx = db.get(Transaction, transaction_id)
    if tx is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
    return TransactionDetail.model_validate(tx)


@router.get("/{transaction_id}/explanation", response_model=ExplanationOut)
def get_explanation(
    transaction_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExplanationOut:
    tx = db.get(Transaction, transaction_id)
    if tx is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    if not predictor.can_explain or not tx.features:
        return ExplanationOut(
            available=False,
            note="Explanation unavailable — the model or stored features are not present.",
        )

    df = pd.DataFrame([tx.features])
    result = predictor.explain_row(df)
    if result is None:
        return ExplanationOut(available=False, note="Explanation could not be generated.")

    return ExplanationOut(
        available=True,
        method=result.get("method"),
        base_value=result.get("base_value"),
        contributions=result.get("contributions", []),
        summary=result.get("summary", []),
        note=_EXPLAIN_NOTE,
    )
