"""Blockchain audit-trail endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.blockchain import service as audit_service
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.audit import AuditEvent
from app.models.user import User
from app.schemas.audit import AuditEventOut, VerificationResult
from app.schemas.common import Page

router = APIRouter(prefix="/audit-events", tags=["audit"])


@router.get("", response_model=Page[AuditEventOut])
def list_events(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    entity_type: str | None = None,
    entity_id: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
) -> Page[AuditEventOut]:
    stmt = select(AuditEvent)
    count_stmt = select(func.count()).select_from(AuditEvent)
    for cond in (
        (AuditEvent.entity_type == entity_type) if entity_type else None,
        (AuditEvent.entity_id == entity_id) if entity_id else None,
    ):
        if cond is not None:
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

    total = db.scalar(count_stmt) or 0
    rows = db.scalars(
        stmt.order_by(AuditEvent.id.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return Page(
        items=[AuditEventOut.model_validate(r) for r in rows],
        total=int(total),
        page=page,
        page_size=page_size,
    )


@router.get("/{event_id}", response_model=AuditEventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AuditEventOut:
    event = db.get(AuditEvent, event_id)
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Audit event not found.")
    return AuditEventOut.model_validate(event)


@router.get("/{event_id}/verify", response_model=VerificationResult)
def verify_event(
    event_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> VerificationResult:
    event = db.get(AuditEvent, event_id)
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Audit event not found.")
    result = audit_service.verify_event(db, event)
    return VerificationResult(**result)
