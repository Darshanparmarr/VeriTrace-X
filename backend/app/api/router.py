"""Aggregate all v1 routers under the API prefix."""
from fastapi import APIRouter

from app.api.routes import analyses, auth, dashboard, datasets, health, model, transactions

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(datasets.router)
api_router.include_router(dashboard.router)
api_router.include_router(analyses.router)
api_router.include_router(transactions.router)
api_router.include_router(model.router)
