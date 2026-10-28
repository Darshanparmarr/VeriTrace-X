# Security & data handling

## Principles
- **Secrets** live in environment variables only; `.env` is git-ignored, `.env.example` documents keys.
- **Passwords** are hashed (bcrypt/argon2 via passlib) — never stored in plaintext (Phase 2).
- **AuthZ**: protected endpoints + role-based checks; a model prediction never auto-confirms fraud.
- **CORS** is restricted to configured origins (`CORS_ORIGINS`).
- **File uploads** are size-limited, type-checked, parsed defensively (malformed CSV/XLSX handled),
  and never executed. Original uploads are never overwritten.
- **Export safety**: CSV/Excel exports are guarded against spreadsheet formula injection (values
  beginning with `= + - @` are neutralised).
- **Responses** never leak secrets, stack traces, or raw uploaded data.
- **Rate limiting** on auth and upload routes (Phase 2/6).

## Data retention & deletion (to finalise in Phase 6)
- Public demo uses synthetic/public data only — no private datasets are published.
- Uploaded datasets and derived results are deletable by their owner; deletion cascades to
  predictions/explanations. Audit events anchored on-chain store only hashes/references, not
  sensitive payloads.

## On-chain data minimisation
Only integrity-relevant metadata (hashes, references, timestamps) is written to the ledger.
Sensitive personal and commercial data stays off-chain.
