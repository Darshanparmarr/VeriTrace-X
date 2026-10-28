"""Health & service-status endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app import __version__
from app.core.config import settings
from app.ml.predictor import predictor

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    model = predictor.status()
    return {
        "status": "ok",
        "version": __version__,
        "env": settings.app_env,
        # Honest service states — no faking.
        "model_status": model["status"],          # active once a model is trained
        "model": model,
        "blockchain": {
            "mode": settings.blockchain_mode,
            "status": "unavailable",               # dev mode is not on-chain
        },
    }
