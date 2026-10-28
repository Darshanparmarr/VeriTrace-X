"""Dataset upload, retrieval, and sample downloads."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.ratelimit import rate_limit
from app.models.user import Role, User
from app.schemas.dataset import DatasetDetail, UploadResponse, ValidationReport
from app.services import dataset_service, sample_data
from app.services.dataset_validation import DataParseError

router = APIRouter(prefix="/datasets", tags=["datasets"])

_ALLOWED_SUFFIX = (".csv", ".tsv", ".txt", ".xlsx", ".xls")


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(30, 60, "upload"))],
)
async def upload_dataset(
    file: UploadFile,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.analyst, Role.admin)),
) -> UploadResponse:
    name = (file.filename or "").lower()
    if not name.endswith(_ALLOWED_SUFFIX):
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Please upload a .csv or .xlsx file.",
        )

    # Enforce the size limit while reading (don't trust client-declared size).
    data = await file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_upload_mb} MB limit.",
        )
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")

    try:
        dataset, report, preview = dataset_service.store_and_validate(
            db, data, file.filename or "upload.csv", user
        )
    except DataParseError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    return UploadResponse(dataset=dataset, validation=report, preview=preview)


@router.get("/sample/template", response_class=PlainTextResponse)
def download_template() -> PlainTextResponse:
    """Blank-ish template (headers + 3 example rows) for users to fill in."""
    return PlainTextResponse(
        sample_data.template_csv(),
        headers={"Content-Disposition": "attachment; filename=veritrace_template.csv"},
    )


@router.get("/sample/example", response_class=PlainTextResponse)
def download_example() -> PlainTextResponse:
    """A small synthetic example dataset (clearly not real data)."""
    return PlainTextResponse(
        sample_data.sample_csv(50),
        headers={"Content-Disposition": "attachment; filename=veritrace_sample.csv"},
    )


@router.get("/{dataset_id}", response_model=DatasetDetail)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DatasetDetail:
    dataset = dataset_service.get_dataset(db, dataset_id)
    if dataset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Dataset not found.")
    detail = DatasetDetail.model_validate(dataset)
    if dataset.validation_report:
        detail.validation_report = ValidationReport.model_validate(dataset.validation_report)
    return detail
