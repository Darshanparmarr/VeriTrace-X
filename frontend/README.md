# VeriTrace-X — Frontend

React + Vite SPA implementing the **Clean Amber Intelligence** design system.

## Scripts
```bash
npm run dev      # dev server (http://localhost:5173), proxies /api -> backend
npm run build    # production build -> dist/
npm run preview  # serve the production build
npm run test     # vitest unit tests
npm run lint     # eslint
```

## Structure
- `src/components/ui/` — design-system primitives (button, card, badge, input, table, tabs,
  progress, skeleton, risk-badge, risk-gauge, states).
- `src/components/layout/` — Sidebar, Topbar, PageHeader.
- `src/layouts/AppLayout.jsx` — authenticated shell with animated route transitions.
- `src/pages/` — Landing + app pages.
- `src/services/demoData.js` — **labelled placeholder** data; replaced by `api.js` in Phase 2.
- `src/lib/utils.js` — `cn()`, formatters, `riskBand()` + documented thresholds.

## Design rules enforced
- Amber is the only primary/accent color — **never blue**.
- Risk is shown with icon + text label, never color alone.
- `prefers-reduced-motion` disables non-essential animation; focus rings are always visible.
- Demo data, illustrative examples, and "blockchain unavailable" states are explicitly labelled.
