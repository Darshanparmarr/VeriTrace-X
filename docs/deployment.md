# Deployment (Phase 7)

> Confirm current free-tier limits and account requirements before deploying — they change, and not
> every component runs continuously for free.

## Target topology (free-tier friendly)
| Component | Suggested host | Notes |
|---|---|---|
| Frontend (static SPA) | Vercel / Netlify / Cloudflare Pages | `npm run build` → `frontend/dist` |
| Backend (FastAPI) | Render / Railway / Fly.io free tier | May cold-start on free tiers |
| Database | Neon / Supabase (managed Postgres) | Set `DATABASE_URL` |
| Source | Public GitHub repo | CI via GitHub Actions |
| Blockchain | Local Fabric dev network first | Always-on hosted Fabric is **not** free |

## Build artifacts
- Frontend: static, CDN-hostable.
- Backend: Dockerfile (Phase 7) or buildpack; expose `app.main:app` via uvicorn/gunicorn.

## Demo vs. production
The live demo clearly labels demo data and runs blockchain in dev mode. It never fakes a successful
on-chain verification or ML prediction. Production mode requires a trained model artifact, a
configured database, and (for real audit) a Fabric network.

## Configuration
All secrets/config via environment variables (`.env.example` lists them). Never commit `.env`.
