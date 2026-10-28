"""Model inference service.

Loads the trained artifact ONCE (never per request), scores feature frames, and
produces SHAP local explanations. Falls back to an explicit "unavailable" state
when no artifact is present, so the API never fakes predictions.
"""
from __future__ import annotations

import json
import sys
import threading
from pathlib import Path

import pandas as pd

from app.core.config import REPO_ROOT, settings

# Make the shared ml package importable (feature contract + SHAP logic live there).
_ML_DIR = REPO_ROOT / "ml"
if str(_ML_DIR) not in sys.path:
    sys.path.insert(0, str(_ML_DIR))


def _artifact_paths() -> tuple[Path, Path, Path]:
    model = REPO_ROOT / settings.model_artifact_path
    meta = REPO_ROOT / settings.model_metadata_path
    background = model.with_name("background.joblib")
    return model, background, meta


class Predictor:
    """Lazy singleton around the fitted pipeline + SHAP explainer."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._loaded = False
        self._pipeline = None
        self._explainer = None
        self._meta: dict | None = None

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            model_path, bg_path, meta_path = _artifact_paths()
            if model_path.exists() and meta_path.exists():
                import joblib
                from veritrace_ml.explain import ShapExplainer

                self._pipeline = joblib.load(model_path)
                self._meta = json.loads(meta_path.read_text(encoding="utf-8"))
                if bg_path.exists():
                    background = joblib.load(bg_path)
                    try:
                        self._explainer = ShapExplainer(self._pipeline, background)
                    except Exception:  # explanations optional; scoring still works
                        self._explainer = None
            self._loaded = True

    # ── Public API ──
    @property
    def is_available(self) -> bool:
        self._ensure_loaded()
        return self._pipeline is not None

    @property
    def meta(self) -> dict | None:
        self._ensure_loaded()
        return self._meta

    @property
    def can_explain(self) -> bool:
        self._ensure_loaded()
        return self._explainer is not None

    def status(self) -> dict:
        self._ensure_loaded()
        if not self.is_available:
            return {"status": "not_trained"}
        m = self._meta or {}
        return {
            "status": "active",
            "algorithm": m.get("algorithm"),
            "version": m.get("version"),
            "trained_at": m.get("trained_at"),
            "data_source": m.get("data_source"),
            "is_synthetic": m.get("is_synthetic", False),
        }

    def score_frame(self, df: pd.DataFrame) -> list[float]:
        """Score a raw DataFrame of order rows -> list of 0..1 risk scores."""
        self._ensure_loaded()
        if self._pipeline is None:
            raise ModelUnavailable()
        from veritrace_ml.features import build_features

        X, _ = build_features(df)
        proba = self._pipeline.predict_proba(X)[:, 1]
        return [float(p) for p in proba]

    def explain_row(self, df_row: pd.DataFrame, top_k: int = 8) -> dict | None:
        """Local SHAP explanation for a single-row raw DataFrame."""
        self._ensure_loaded()
        if self._pipeline is None or self._explainer is None:
            return None
        return self._local(df_row, top_k)

    def _local(self, df_row: pd.DataFrame, top_k: int) -> dict:
        from veritrace_ml.explain import plain_english
        from veritrace_ml.features import build_features

        X, _ = build_features(df_row)
        result = self._explainer.local(X, top_k=top_k)
        result["summary"] = plain_english(result["contributions"])
        return result

    def reload(self) -> None:
        with self._lock:
            self._loaded = False
            self._pipeline = None
            self._explainer = None
            self._meta = None


class ModelUnavailable(Exception):
    """Raised when scoring is attempted without a trained model."""


# Module-level singleton.
predictor = Predictor()
