"""VeriTrace-X FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("veritrace")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev convenience: ensure tables exist (production uses Alembic migrations).
    if not settings.is_production:
        init_db()
        logger.info("Database initialised (dev mode).")
    yield


app = FastAPI(
    title=settings.project_name,
    version=__version__,
    description=(
        "Explainable-AI supply-chain fraud detection with a tamper-evident audit trail. "
        "Blockchain runs in development mode (not on-chain) until Fabric is configured."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Consistent error envelopes (never leak stack traces) ──
@app.exception_handler(RequestValidationError)
async def _validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": exc.errors()},
    )


@app.exception_handler(Exception)
async def _unhandled_handler(request: Request, exc: Exception):  # pragma: no cover
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["health"])
def root() -> dict:
    return {
        "name": settings.project_name,
        "version": __version__,
        "docs": "/docs",
        "api": settings.api_v1_prefix,
    }
