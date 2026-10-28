# Deployment

> Confirm current free-tier limits and account requirements before deploying — they change, and
> not every component runs continuously for free (free DBs/web services sleep or expire).

## Option A — Docker Compose (one command, local or a single VM)
Builds Postgres + backend + an nginx-served frontend. The backend image **bakes a synthetic-data
model** so predictions work immediately (clearly labelled synthetic).

```bash
docker compose up --build
# frontend  -> http://localhost:8080
# backend   -> http://localhost:8000/docs
```
To serve the **real** model instead, train locally (`cd ml && python -m veritrace_ml.train`) and
uncomment the `./ml/artifacts` volume mount under the `backend` service in `docker-compose.yml`.

Seed demo data (optional):
```bash
docker compose exec backend python scripts/seed_demo.py
```

## Option B — Free-tier managed hosting
| Component | Host | How |
|---|---|---|
| Frontend (SPA) | **Vercel** | Import the repo, set root dir to `frontend/`. Edit `frontend/vercel.json` → replace the backend host in the `/api` rewrite. |
| Backend (FastAPI) | **Render** | "New → Blueprint" → point at `render.yaml`. It provisions the web service (Docker) + a free Postgres and wires `DATABASE_URL`. Set `CORS_ORIGINS` to your Vercel URL. |
| Database | **Render Postgres** (or Neon/Supabase) | `DATABASE_URL` is injected by the blueprint; `postgres://` URLs are auto-normalised for psycopg3. |

Steps:
1. Push to GitHub (done: `Darshanparmarr/VeriTrace-X`).
2. **Render**: create the blueprint from `render.yaml`; after first deploy, copy the service URL.
3. **Vercel**: deploy `frontend/`; set the `/api` rewrite destination to the Render URL; redeploy.
4. Set the backend `CORS_ORIGINS` env to the Vercel origin.
5. (Optional) run the demo seed: Render shell → `python scripts/seed_demo.py`.

## The model in production
- The Docker image trains a **synthetic** model at build time → the demo works out of the box and
  is labelled "trained on synthetic data" everywhere.
- For real metrics, train on the DataCo CSV and ship/mount `ml/artifacts/` (or bake it into a
  custom image). The 95 MB dataset and model binaries are git-ignored by design.

## Demo vs. production
The live demo clearly labels demo data, trains on synthetic data, and runs blockchain in dev mode
(local hash-chain, **not** on-chain). It never fakes a successful on-chain verification or ML
prediction. Real on-chain audit requires a configured Hyperledger Fabric network (see
[`../blockchain/README.md`](../blockchain/README.md)).

## Configuration
All secrets/config via environment variables — see [`../.env.example`](../.env.example). Never commit
`.env`. Generate a strong `SECRET_KEY` in production (the Render blueprint does this automatically).

## CI
`.github/workflows/ci.yml` runs on every push/PR: backend pytest (trains a synthetic model first so
ML tests run) and frontend lint + unit tests + build.
