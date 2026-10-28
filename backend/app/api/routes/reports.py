"""Reports: summaries and safe CSV exports."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.transaction import RiskBand
from app.models.user import User
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary")
def report_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return report_service.summary(db)


@router.get("/transactions.csv", response_class=PlainTextResponse)
def transactions_csv(
    risk: RiskBand | None = None,
    analysis_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlainTextResponse:
    csv = report_service.transactions_csv(db, risk=risk, analysis_id=analysis_id)
    return PlainTextResponse(
        csv, headers={"Content-Disposition": "attachment; filename=veritrace_transactions.csv"}
    )


@router.get("/reviews.csv", response_class=PlainTextResponse)
def reviews_csv(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlainTextResponse:
    csv = report_service.reviews_csv(db)
    return PlainTextResponse(
        csv, headers={"Content-Disposition": "attachment; filename=veritrace_reviews.csv"}
    )
