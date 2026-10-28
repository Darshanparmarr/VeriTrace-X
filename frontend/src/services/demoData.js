/**
 * ─────────────────────────────────────────────────────────────
 * DEMO DATA — clearly labelled, synthetic, NOT production figures.
 * ─────────────────────────────────────────────────────────────
 * This module provides deterministic placeholder data so the UI can render
 * realistic states before the FastAPI backend (Phase 2) and ML model
 * (Phase 3) are wired in. Every consumer surfaces an explicit "Demo data"
 * indicator. Risk scores here are illustrative and are NOT model output.
 *
 * Replace these functions with real API calls in src/services/api.js.
 */

export const IS_DEMO = true

export const dashboardSummary = {
  isDemo: true,
  analyzed: 180519, // research dataset size (DataCo Smart Supply Chain) — context only
  requiresReview: 1427,
  highRisk: 388,
  reviewed: 642,
  // Suspected-fraud rate from the research report (~2.25%) — research context, not a model result.
  suspectedFraudRate: 0.0225,
  modelStatus: 'not_trained', // until Phase 3 training runs
  dataFreshness: null,
  blockchain: { mode: 'development', status: 'unavailable' },
}

export const riskDistribution = [
  { band: 'Low', count: 168240, color: '#059669' },
  { band: 'Medium', count: 8464, color: '#F59E0B' },
  { band: 'High', count: 3427, color: '#D97706' },
  { band: 'Critical', count: 388, color: '#DC2626' },
]

export const riskTrend = [
  { date: 'Wk 1', flagged: 210, reviewed: 120 },
  { date: 'Wk 2', flagged: 265, reviewed: 160 },
  { date: 'Wk 3', flagged: 240, reviewed: 180 },
  { date: 'Wk 4', flagged: 320, reviewed: 210 },
  { date: 'Wk 5', flagged: 298, reviewed: 240 },
  { date: 'Wk 6', flagged: 355, reviewed: 300 },
]

export const recentTransactions = [
  mkTx('VX-1024', 'Northwind Traders', 'Industrial Sensor Kit', 'Los Angeles, US', 48200, 0.87, 'new'),
  mkTx('VX-1023', 'Globex Supply Co.', 'Thermal Camera', 'Rotterdam, NL', 12750, 0.78, 'under_review'),
  mkTx('VX-1019', 'Acme Components', 'Hydraulic Valve', 'Hamburg, DE', 2140, 0.64, 'new'),
  mkTx('VX-1012', 'Soylent Corp', 'Packaging Film', 'Mumbai, IN', 980, 0.33, 'legitimate'),
  mkTx('VX-1007', 'Initech Parts', 'Circuit Board', 'Shenzhen, CN', 15600, 0.91, 'escalated'),
  mkTx('VX-1003', 'Umbrella Logistics', 'Cold-chain Unit', 'Austin, US', 7300, 0.19, 'legitimate'),
]

export const reviewActivity = [
  { id: 1, actor: 'Analyst A', action: 'Escalated', target: 'VX-1007', when: '2h ago' },
  { id: 2, actor: 'Analyst B', action: 'Marked legitimate', target: 'VX-1003', when: '5h ago' },
  { id: 3, actor: 'Analyst A', action: 'Opened case', target: 'VX-1023', when: '6h ago' },
  { id: 4, actor: 'Reviewer C', action: 'Added note', target: 'VX-1024', when: '1d ago' },
]

function mkTx(id, supplier, product, location, value, score, status) {
  return { id, supplier, product, location, value, score, status }
}
