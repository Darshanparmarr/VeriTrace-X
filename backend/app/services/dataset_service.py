"""Dataset persistence: store an upload, validate it, record the result."""
from __future__ import annotations

import hashlib
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.dataset import Dataset, DatasetStatus
from app.models.user import User
from app.schemas.dataset import ValidationReport
from app.services import dataset_validation as dv


def _store_file(data: bytes, original_filename: str, content_hash: str) -> str:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    # Store under the content hash to dedupe and avoid path traversal from user names.
    suffix = Path(original_filename).suffix.lower() or ".csv"
    dest = upload_dir / f"{content_hash}{suffix}"
    if not dest.exists():
        dest.write_bytes(data)
    return str(dest)


def store_and_validate(
    db: Session, data: bytes, original_filename: str, user: User | None
) -> tuple[Dataset, ValidationReport, list[dict]]:
    """Parse, validate, persist. The original bytes are stored unchanged."""
    content_hash = hashlib.sha256(data).hexdigest()

    df, parse_warnings = dv.read_tabular(data, original_filename)
    report = dv.build_report(df, extra_warnings=parse_warnings)
    preview = dv.preview_records(df)

    storage_path = _store_file(data, original_filename, content_hash)

    dataset = Dataset(
        original_filename=original_filename,
        storage_path=storage_path,
        content_hash=content_hash,
        row_count=report.row_count,
        column_count=report.column_count,
        status=DatasetStatus.validated if report.is_valid else DatasetStatus.invalid,
        validation_report=report.model_dump(),
        uploaded_by_id=user.id if user else None,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset, report, preview


def get_dataset(db: Session, dataset_id: int) -> Dataset | None:
    return db.get(Dataset, dataset_id)
