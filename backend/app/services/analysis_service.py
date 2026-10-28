"""Run an analysis: score a stored dataset and persist transactions."""
from __future__ import annotations

import math
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

from app.ml.predictor import ModelUnavailable, predictor
from app.models.analysis import AnalysisJob, AnalysisStatus
from app.models.dataset import Dataset, DatasetStatus
from app.models.transaction import RiskBand, ReviewStatus, Transaction
from app.models.user import User
from app.services.dataset_validation import read_tabular
from app.services.schema import exact_alias_match

# Cap rows persisted per analysis (keeps the demo DB and UI responsive).
MAX_ROWS = 5000


def band_for_score(score: float, thresholds: dict) -> RiskBand:
    if score is None or (isinstance(score, float) and math.isnan(score)):
        return RiskBand.unknown
    if score >= thresholds.get("high", 0.75):
        return RiskBand.critical
    if score >= thresholds.get("medium", 0.5):
        return RiskBand.high
    if score >= thresholds.get("low", 0.25):
        return RiskBand.medium
    return RiskBand.low


def _display_map(columns) -> dict[str, str]:
    """Resolve display columns (supplier/product/location/value/order_id) from source names."""
    wanted = {
        "order_id": None,
        "product_name": None,
        "customer_segment": None,  # stands in for 'supplier' (DataCo is customer-centric)
        "order_region": None,
        "order_value": None,
    }
    for col in columns:
        key = exact_alias_match(col)
        if key in wanted and wanted[key] is None:
            wanted[key] = col
    return wanted


def _val(row, col):
    if not col or col not in row:
        return None
    v = row[col]
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return v


def _num(v):
    try:
        f = float(v)
        return None if math.isnan(f) else f
    except (TypeError, ValueError):
        return None


def _features_json(row: pd.Series) -> dict:
    out = {}
    for k, v in row.items():
        if v is None or (isinstance(v, float) and math.isnan(v)) or pd.isna(v):
            out[str(k)] = None
        elif isinstance(v, (int, float)):
            out[str(k)] = float(v)
        else:
            out[str(k)] = str(v)
    return out


def run_analysis(db: Session, dataset: Dataset, user: User | None) -> AnalysisJob:
    job = AnalysisJob(
        dataset_id=dataset.id,
        created_by_id=user.id if user else None,
        status=AnalysisStatus.running,
        progress=0.0,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    if not predictor.is_available:
        job.status = AnalysisStatus.failed
        job.error = "No trained model is available. Train a model first (see ml/README.md)."
        db.commit()
        return job

    try:
        data = Path(dataset.storage_path).read_bytes()
        df, _ = read_tabular(data, dataset.original_filename)
        total_rows = len(df)
        work = df.head(MAX_ROWS).reset_index(drop=True)

        from veritrace_ml.features import build_features

        scores = predictor.score_frame(work)
        X_feat, _ = build_features(work)
        thresholds = (predictor.meta or {}).get(
            "risk_band_thresholds", {"low": 0.25, "medium": 0.5, "high": 0.75}
        )
        cols = _display_map(work.columns)

        band_counts = {b.value: 0 for b in (RiskBand.low, RiskBand.medium, RiskBand.high, RiskBand.critical)}
        txs: list[Transaction] = []
        for i, row in work.iterrows():
            score = scores[i]
            band = band_for_score(score, thresholds)
            band_counts[band.value] = band_counts.get(band.value, 0) + 1
            order_id = _val(row, cols["order_id"])
            txs.append(
                Transaction(
                    analysis_id=job.id,
                    order_id=str(order_id) if order_id is not None else f"ROW-{i+1}",
                    supplier=_as_str(_val(row, cols["customer_segment"])),
                    product=_as_str(_val(row, cols["product_name"])),
                    location=_as_str(_val(row, cols["order_region"])),
                    order_value=_num(_val(row, cols["order_value"])),
                    risk_score=score,
                    risk_band=band,
                    review_status=ReviewStatus.new,
                    features=_features_json(X_feat.iloc[i]),
                )
            )
        db.add_all(txs)

        flagged = band_counts.get("high", 0) + band_counts.get("critical", 0)
        meta = predictor.meta or {}
        job.status = AnalysisStatus.completed
        job.progress = 1.0
        job.model_version_id = None
        job.summary = {
            "rows_scored": len(work),
            "total_rows": total_rows,
            "truncated": total_rows > MAX_ROWS,
            "max_rows": MAX_ROWS,
            "band_counts": band_counts,
            "flagged": flagged,
            "model_version": meta.get("version"),
            "data_source": meta.get("data_source"),
            "is_synthetic": meta.get("is_synthetic", False),
        }
        dataset.status = DatasetStatus.analyzed
        db.commit()
        db.refresh(job)
        return job

    except ModelUnavailable:
        job.status = AnalysisStatus.failed
        job.error = "Model unavailable during scoring."
        db.commit()
        return job
    except Exception as exc:  # pragma: no cover - defensive
        job.status = AnalysisStatus.failed
        job.error = f"Analysis failed: {exc}"
        db.commit()
        return job


def _as_str(v):
    return None if v is None else str(v)
