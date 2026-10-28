"""Analysis job + transaction + explanation schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.analysis import AnalysisStatus
from app.models.transaction import RiskBand, ReviewStatus


class AnalysisCreate(BaseModel):
    dataset_id: int


class AnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    status: AnalysisStatus
    progress: float
    error: str | None = None
    summary: dict | None = None
    created_at: datetime


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: str
    supplier: str | None
    product: str | None
    location: str | None
    order_value: float | None
    risk_score: float | None
    risk_band: RiskBand
    review_status: ReviewStatus
    created_at: datetime


class TransactionDetail(TransactionOut):
    analysis_id: int | None = None
    features: dict | None = None


class Contribution(BaseModel):
    feature: str
    label: str
    value: float
    direction: str  # increases | decreases


class ExplanationOut(BaseModel):
    available: bool
    method: str | None = None
    base_value: float | None = None
    contributions: list[Contribution] = []
    summary: list[str] = []
    note: str


class TraceResponse(BaseModel):
    transaction: TransactionDetail
    related: list[TransactionOut]
    audit_events: list[dict]


class ModelCard(BaseModel):
    status: str                       # active | not_trained
    algorithm: str | None = None
    version: str | None = None
    trained_at: str | None = None
    data_source: str | None = None
    is_synthetic: bool = False
    metrics: dict | None = None
    global_importance: list[dict] = []
    risk_band_thresholds: dict | None = None
    class_balance: dict | None = None
    limitations: list[str] = []
