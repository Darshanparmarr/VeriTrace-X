# API

Base prefix: `/api/v1`. OpenAPI docs served at `/docs` (Swagger) and `/redoc`.
Auth: JWT bearer tokens (`Authorization: Bearer <token>`).

Status legend: ✅ implemented (Phase 2) · ⏳ planned.

| | Method | Path | Purpose |
|---|---|---|---|
| ✅ | GET | `/health` | Service status (model + blockchain, honest states) |
| ✅ | POST | `/auth/register` | Create a user, returns a token |
| ✅ | POST | `/auth/login` | Obtain an access token |
| ✅ | GET | `/auth/me` | Current user profile |
| ✅ | POST | `/datasets/upload` | Upload CSV/Excel — size-limited, validated, preview |
| ✅ | GET | `/datasets/{dataset_id}` | Dataset metadata + validation report |
| ✅ | GET | `/datasets/sample/template` | Download a fill-in CSV template |
| ✅ | GET | `/datasets/sample/example` | Download a synthetic example dataset |
| ✅ | GET | `/dashboard/summary` | KPI + status overview (real counts; `is_demo` when empty) |
| ✅ | GET | `/model` | Model card: algorithm, version, metrics, global SHAP importance, limitations |
| ✅ | POST | `/analyses` | Score a dataset with the model; persists transactions + summary |
| ✅ | GET | `/analyses/{analysis_id}` | Job status + progress + summary |
| ✅ | GET | `/transactions` | List (search `q`, filter `risk`/`review_status`, paginate), sorted by risk |
| ✅ | GET | `/transactions/{id}` | Transaction detail incl. stored features |
| ✅ | GET | `/transactions/{id}/explanation` | SHAP local explanation (lazy, from stored features) |
| ⏳ | POST | `/transactions/{id}/reviews` | Record a review decision — Phase 4 |
| ⏳ | GET | `/audit-events` | List audit events — Phase 5 |
| ⏳ | GET | `/audit-events/{event_id}/verify` | Verify against the ledger — Phase 5 |
| ⏳ | GET | `/reports` | Report data for export — Phase 6 |

### Upload validation contract
`POST /datasets/upload` (multipart `file`) returns `{ dataset, validation, preview }`:
- `validation.is_valid` — false when a **required** canonical column (order_id, order_value) is missing.
- `validation.required_missing` / `required_present`, `suggested_mapping` (fuzzy source→canonical),
  `duplicate_rows`, `missing_values`, `issues` (e.g. non-numeric), `warnings`.
- Malformed CSV rows are **reported** (counted in warnings), never silently dropped.

Conventions: consistent error envelope (`{"detail": ...}`), Pydantic validation, JWT auth,
role-based authorization (upload requires analyst/admin), CORS restricted to configured origins.
Secrets, stack traces, and raw uploaded data are never returned. Rate limiting: Phase 6.
