"""Health & service-status endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app import __version__
from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "version": __version__,
        "env": settings.app_env,
        # Honest service states — no faking.
        "model_status": "not_trained",            # becomes "active" in Phase 3
        "blockchain": {
            "mode": settings.blockchain_mode,
            "status": "unavailable",               # dev mode is not on-chain
        },
    }
