# VeriTrace-X — Architecture

> Status: Phase 1 complete (frontend scaffold, design system, navigation, components).
> Later phases add the backend, ML pipeline, and blockchain integration.

## 1. System overview

VeriTrace-X is a two-tier web application with an offline ML training pipeline and an
optional blockchain audit layer.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (SPA)                                                        │
│  React + Vite · Tailwind (Clean Amber) · Router · Motion/GSAP         │
└───────────────┬───────────────────────────────────────────────────────┘
                │  HTTPS  (/api/v1/*)
┌───────────────▼───────────────────────────────────────────────────────┐
│  FastAPI backend                      (Phase 2+)                        │
│  api · core(security/config) · schemas(pydantic) · services            │
│  repositories · ml(inference) · blockchain · workers(jobs)             │
└───────┬───────────────────────┬──────────────────────┬────────────────┘
        │                       │                        │
┌───────▼────────┐    ┌─────────▼─────────┐    ┌─────────▼──────────────┐
│ PostgreSQL      │    │ Model artifacts    │    │ Hyperledger Fabric      │
│ (SQLite in dev) │    │ (joblib + meta)    │    │ (dev: hash-chain log)   │
│ SQLAlchemy +    │    │ trained offline in │    │ chaincode + verify      │
│ Alembic         │    │ ml/ (Phase 3)      │    │ (Phase 5)               │
└─────────────────┘    └───────────────────┘    └────────────────────────┘
```

## 2. Why these choices

| Decision | Rationale |
|---|---|
| **SQLite default, Postgres-ready** | Zero-setup local dev without Docker; SQLAlchemy models are written portably so production uses Postgres via `DATABASE_URL`. |
| **Model trained offline, loaded once** | The prompt forbids retraining per request. Training lives in `ml/`; the API loads a versioned artifact at startup. |
| **Blockchain dev mode = local hash-chain** | No Fabric network is required to develop. Dev mode is explicitly labelled *not on-chain*; verification honestly returns "unavailable". Real Fabric wiring is Phase 5. |
| **Background jobs for analysis** | Dataset scoring can exceed an HTTP request budget; a worker returns job status/progress. |
| **SPA + lazy routes** | Fast initial dashboard load; each page is a separate chunk. |

## 3. Frontend structure (implemented)

```
frontend/src/
  components/
    ui/            Design-system primitives (button, card, badge, input, table,
                   tabs, progress, skeleton, risk-badge, risk-gauge, states)
    layout/        Sidebar, Topbar, PageHeader
    landing/       SupplyChainViz (GSAP)
    review/        ReviewPanel
    Logo, StatCard, PhaseNotice
  config/nav.js    Sidebar navigation model
  layouts/         AppLayout (shell with animated outlet)
  pages/           Landing, Dashboard, AnalyzeData, Transactions,
                   TransactionDetails, Review, Explainability, Traceability,
                   Audit, Reports, Settings, NotFound
  services/        demoData.js (labelled placeholder; replaced by api.js in Phase 2)
  lib/utils.js     cn(), formatters, riskBand() + documented thresholds
  styles/index.css Design tokens (CSS variables) + base layer
```

## 4. Design system — Clean Amber Intelligence

Semantic colors are CSS variables (`--bg`, `--surface`, `--card`, `--fg`, …) consumed by Tailwind
via `rgb(var(--x) / <alpha-value>)`. The amber scale is the primary identity; **blue is never used**
as a primary/accent/nav/button color. Green/red appear only for meaningful success/critical status,
and risk is always carried by an icon + text label, never color alone (see `RiskBadge`, `RiskGauge`).

Accessibility: visible `:focus-visible` rings, keyboard-navigable nav/tabs, and a global
`prefers-reduced-motion` override that disables non-essential animation.

## 5. Honesty guarantees baked into the UI

- Seeded figures render a **"Demo data"** pill and an inline disclosure.
- The `VX-1024` details page is labelled **illustrative** — scores/contributions are placeholders.
- Blockchain shows **"unavailable"** in dev mode and never fakes a successful verification.
- Risk scores are described as an uncalibrated signal, distinct from model confidence and from
  confirmed fraud. Confirming fraud is always an explicit human action requiring a reason.

## 6. Planned API surface (Phase 2+)

`/api/v1/auth/*`, `/dashboard/summary`, `/datasets/*`, `/analyses/*`, `/transactions/*`,
`/transactions/{id}/explanation`, `/transactions/{id}/reviews`, `/audit-events/*`, `/reports`.
See [`api.md`](api.md) (filled in during Phase 2).
