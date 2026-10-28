"""Model card endpoint — powers the Explainable AI page."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.ml.predictor import predictor
from app.models.user import User
from app.schemas.analysis import ModelCard

router = APIRouter(prefix="/model", tags=["model"])


@router.get("", response_model=ModelCard)
def model_card(user: User = Depends(get_current_user)) -> ModelCard:
    if not predictor.is_available:
        return ModelCard(status="not_trained", limitations=[
            "No model artifact found. Train one with: python -m veritrace_ml.train (in ml/).",
        ])
    m = predictor.meta or {}
    return ModelCard(
        status="active",
        algorithm=m.get("algorithm"),
        version=m.get("version"),
        trained_at=m.get("trained_at"),
        data_source=m.get("data_source"),
        is_synthetic=m.get("is_synthetic", False),
        metrics=m.get("metrics", {}).get("selected"),
        global_importance=m.get("global_importance", []),
        risk_band_thresholds=m.get("risk_band_thresholds"),
        class_balance=m.get("class_balance"),
        limitations=m.get("limitations", []),
    )
