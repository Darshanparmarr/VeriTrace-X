# Setup

## Prerequisites
- Node.js 20+ and npm
- Python 3.11+ (3.13 works)
- Git
- (Optional) Docker + Docker Compose — for Postgres and reproducible dev

## Frontend (available now — Phase 1)
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run test       # vitest unit tests
```

## Backend (Phase 2)
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate      # Windows (PowerShell/Git Bash)
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp ../.env.example ../.env     # then edit secrets
alembic upgrade head           # create tables (SQLite by default)
uvicorn app.main:app --reload  # http://localhost:8000  (docs at /docs)
```

## Environment
Copy `.env.example` to `.env`. Local dev defaults to SQLite and blockchain dev mode — no external
services required. For Postgres, set `DATABASE_URL=postgresql+psycopg://…`.

## Dataset (Phase 3)
Place the DataCo Smart Supply Chain CSV at `ml/data/raw/`. See
[`model-evaluation.md`](model-evaluation.md) for the schema, target definition, and training steps.
Large data files are git-ignored by design.
