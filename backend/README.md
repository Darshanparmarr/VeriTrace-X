# VeriTrace-X — Backend (FastAPI)

Explainable-AI supply-chain fraud detection API. Python 3.11+ (3.13 verified).

## Setup
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate            # Windows (Git Bash / PowerShell: .venv\Scripts\activate)
pip install -r requirements.txt
cp ../.env.example ../.env           # optional; sensible dev defaults work without it

alembic upgrade head                 # create tables (SQLite by default)
uvicorn app.main:app --reload        # http://localhost:8000  ·  docs at /docs
```

Local dev uses **SQLite** (zero setup) and blockchain **development mode** (not on-chain).
For Postgres, set `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/veritrace` in `.env`
(and uncomment `psycopg` in `requirements.txt`).

## Tests
```bash
pytest                               # 20 tests: auth, upload/validation, export safety, health
```

## Layout
```
app/
  core/        config, database, security (bcrypt + JWT), deps (auth guards), safe_export
  models/      User/Role, Dataset, AnalysisJob, Transaction, Prediction, ModelVersion,
               Explanation, ReviewCase/Decision, AuditEvent, BlockchainReference
  schemas/     Pydantic request/response contracts
  services/    auth, dataset storage + validation, canonical schema/aliases, sample data
  api/routes/  health, auth, datasets, dashboard
  main.py      app factory, CORS, error envelopes
alembic/       migration environment + initial schema
tests/
```

## Design notes
- **Honest states**: `/health` reports model `not_trained` and blockchain `unavailable` in dev —
  nothing is faked.
- **Upload safety**: size-limited, type-checked, defensively parsed; malformed rows are *reported*,
  never silently dropped; CSV exports neutralise spreadsheet formula injection.
- **Fraud label**: derived from DataCo `Order Status == "SUSPECTED_FRAUD"` — *suspected*, not confirmed.
- Model training/inference and SHAP/LIME land in **Phase 3**; the model is trained offline and
  loaded once (never per request).
