"""Application settings endpoints (configurable risk thresholds)."""
from __future__ import annotations

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import Role, User
from app.services import settings_service

router = APIRouter(prefix="/settings", tags=["settings"])


class Thresholds(BaseModel):
    low: float = Field(ge=0, le=1)
    medium: float = Field(ge=0, le=1)
    high: float = Field(ge=0, le=1)


@router.get("/thresholds", response_model=Thresholds)
def get_thresholds(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Thresholds:
    return Thresholds(**settings_service.get_thresholds(db))


@router.put("/thresholds", response_model=Thresholds)
def put_thresholds(
    body: Thresholds,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.analyst, Role.admin)),
) -> Thresholds:
    saved = settings_service.set_thresholds(db, body.low, body.medium, body.high)
    return Thresholds(**saved)
