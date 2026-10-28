# Security & data handling

## Principles (implemented)
- **Secrets** live in environment variables only; `.env` is git-ignored, `.env.example` documents keys.
- **Passwords** are hashed with bcrypt (direct, 72-byte guarded) — never stored in plaintext.
- **AuthZ**: JWT bearer tokens; role-based checks (viewers can't record reviews; upload/threshold
  changes require analyst/admin). A model prediction never auto-confirms fraud.
- **CORS** restricted to configured origins (`CORS_ORIGINS`).
- **Security headers** on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS in production.
- **Rate limiting** (in-memory, per IP) on `/auth/login`, `/auth/register`, `/datasets/upload`
  → HTTP 429 when exceeded. Back with Redis for multi-instance production.
- **File uploads** are size-limited, type-checked, parsed defensively (malformed CSV/XLSX rows are
  reported, never executed or silently dropped). Original uploads are never overwritten.
- **Export safety**: CSV exports neutralise spreadsheet formula injection (values beginning with
  `= + - @` are prefixed with `'`). Verified by tests.
- **Responses** never leak secrets, stack traces, or raw uploaded data (generic 500 envelope).

## Data retention & deletion (to finalise in Phase 6)
- Public demo uses synthetic/public data only — no private datasets are published.
- Uploaded datasets and derived results are deletable by their owner; deletion cascades to
  predictions/explanations. Audit events anchored on-chain store only hashes/references, not
  sensitive payloads.

## On-chain data minimisation
Only integrity-relevant metadata (hashes, references, timestamps) is written to the ledger.
Sensitive personal and commercial data stays off-chain.
