#!/usr/bin/env bash
# Backend container entrypoint: apply migrations, then serve.
set -e

echo "[entrypoint] Running database migrations…"
alembic upgrade head || echo "[entrypoint] migration step failed (continuing)"

# Workers: default 2; override with WEB_CONCURRENCY. Honour $PORT (Render/Railway set it).
PORT="${PORT:-8000}"
WORKERS="${WEB_CONCURRENCY:-2}"

echo "[entrypoint] Starting uvicorn on :${PORT} (${WORKERS} worker(s))…"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --workers "${WORKERS}"
