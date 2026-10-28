"""Application settings — currently the configurable risk-band thresholds."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.setting import AppSetting

THRESHOLDS_KEY = "risk_band_thresholds"
DEFAULT_THRESHOLDS = {"low": 0.25, "medium": 0.5, "high": 0.75}


def get_thresholds(db: Session) -> dict:
    row = db.get(AppSetting, THRESHOLDS_KEY)
    if row and isinstance(row.value, dict):
        return {**DEFAULT_THRESHOLDS, **row.value}
    return dict(DEFAULT_THRESHOLDS)


def set_thresholds(db: Session, low: float, medium: float, high: float) -> dict:
    if not (0 < low < medium < high < 1):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Thresholds must satisfy 0 < low < medium < high < 1.",
        )
    value = {"low": round(low, 4), "medium": round(medium, 4), "high": round(high, 4)}
    row = db.get(AppSetting, THRESHOLDS_KEY)
    if row is None:
        row = AppSetting(key=THRESHOLDS_KEY, value=value)
        db.add(row)
    else:
        row.value = value
    db.commit()
    return value
