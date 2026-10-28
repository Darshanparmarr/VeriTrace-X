"""Analysis job endpoints — score an uploaded dataset with the trained model."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import Role, User
from app.schemas.analysis import AnalysisCreate, AnalysisOut
from app.services import analysis_service, dataset_service

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.post("", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
def create_analysis(
    body: AnalysisCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.analyst, Role.admin)),
) -> AnalysisOut:
    dataset = dataset_service.get_dataset(db, body.dataset_id)
    if dataset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Dataset not found.")

    # Run synchronously (datasets are capped). A real deployment would enqueue this
    # as a background job; the status/progress fields already support that.
    job = analysis_service.run_analysis(db, dataset, user)
    if job.status.value == "failed":
        # 409: a valid request we can't fulfil yet (e.g. no trained model).
        raise HTTPException(status.HTTP_409_CONFLICT, detail=job.error or "Analysis failed.")
    return job


@router.get("/{analysis_id}", response_model=AnalysisOut)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AnalysisOut:
    from app.models.analysis import AnalysisJob

    job = db.get(AnalysisJob, analysis_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Analysis not found.")
    return job
