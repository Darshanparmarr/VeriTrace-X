"""Application configuration, loaded from environment variables / .env.

Secrets never live in code. See `.env.example` at the repo root for the full list.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root = backend/..  (so a single .env at the root serves both tiers)
REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        protected_namespaces=(),  # we use model_* field names deliberately
    )

    # ── App ──
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    project_name: str = "VeriTrace-X API"

    # ── Security ──
    secret_key: str = "dev-insecure-change-me"
    access_token_expire_minutes: int = 60
    jwt_algorithm: str = "HS256"

    # ── CORS ── (comma-separated string in env -> list)
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    # ── Database ──
    # Default to a zero-setup SQLite file at the repo root for local dev.
    database_url: str = f"sqlite:///{(REPO_ROOT / 'veritrace.db').as_posix()}"

    # ── Uploads ──
    max_upload_mb: int = 50
    upload_dir: str = (REPO_ROOT / "backend" / "uploads").as_posix()

    # ── Rate limiting ──
    rate_limit_enabled: bool = True

    # ── ML (wired in Phase 3) ──
    model_artifact_path: str = "ml/artifacts/model.joblib"
    model_metadata_path: str = "ml/artifacts/model_meta.json"

    # ── Blockchain ──
    blockchain_mode: str = "development"  # development | fabric

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
