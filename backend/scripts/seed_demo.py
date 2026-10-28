"""Seed clearly-labelled DEMO data for a public demo.

Creates a demo analyst account and runs one analysis on SYNTHETIC data (no private
data is ever used). Safe to run repeatedly — it won't duplicate the demo user.

Usage (from backend/, with the venv active):
    python scripts/seed_demo.py
"""
from __future__ import annotations

import sys
from pathlib import Path

# Make the backend package importable when run as a script.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal, init_db  # noqa: E402
from app.ml.predictor import predictor  # noqa: E402
from app.schemas.auth import UserCreate  # noqa: E402
from app.services import analysis_service, auth_service, dataset_service, sample_data  # noqa: E402

DEMO_EMAIL = "demo@veritrace.x"
DEMO_PASSWORD = "demo-analyst-123"


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        user = auth_service.get_user_by_email(db, DEMO_EMAIL)
        if user is None:
            user = auth_service.register_user(
                db,
                UserCreate(email=DEMO_EMAIL, full_name="Demo Analyst", password=DEMO_PASSWORD),
            )
            print(f"[seed] created demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        else:
            print(f"[seed] demo user already exists: {DEMO_EMAIL}")

        # Synthetic dataset — clearly NOT real data.
        csv = sample_data.sample_csv(200).encode()
        dataset, report, _ = dataset_service.store_and_validate(db, csv, "demo_sample.csv", user)
        print(f"[seed] dataset #{dataset.id}: {report.row_count} rows, valid={report.is_valid}")

        if not predictor.is_available:
            print("[seed] No trained model found — skipping analysis. "
                  "Train one with: (cd ml && python -m veritrace_ml.train)")
            return

        job = analysis_service.run_analysis(db, dataset, user)
        print(f"[seed] analysis #{job.id}: {job.status.value} "
              f"-> {job.summary.get('band_counts') if job.summary else None}")
        print("[seed] Done. Sign in as the demo user to explore populated dashboards.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
