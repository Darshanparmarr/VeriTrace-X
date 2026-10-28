# API (planned — Phase 2+)

Base prefix: `/api/v1`. OpenAPI docs will be served at `/docs` (Swagger) and `/redoc`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create a user |
| POST | `/auth/login` | Obtain an access token |
| GET | `/dashboard/summary` | KPI + status overview |
| POST | `/datasets/upload` | Upload CSV/Excel (validated, size-limited) |
| GET | `/datasets/{dataset_id}` | Dataset metadata + validation report |
| POST | `/analyses` | Start an analysis job (async) |
| GET | `/analyses/{analysis_id}` | Job status + progress + summary |
| GET | `/transactions` | List (search, filter, sort, paginate) |
| GET | `/transactions/{id}` | Transaction detail |
| GET | `/transactions/{id}/explanation` | SHAP/LIME explanation |
| POST | `/transactions/{id}/reviews` | Record a review decision |
| GET | `/audit-events` | List audit events |
| GET | `/audit-events/{event_id}/verify` | Verify against the ledger (or "unavailable") |
| GET | `/reports` | Report data for export |

Conventions: consistent error envelope, request/response validation (Pydantic), JWT auth,
role-based authorization, structured logging, and rate limiting on sensitive routes. Secrets,
stack traces, and raw uploaded data are never returned in responses.

> This file is fleshed out with request/response schemas as endpoints are implemented.
