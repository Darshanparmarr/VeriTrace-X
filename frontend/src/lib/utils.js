import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Format a number as a currency string (USD by default). */
export function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value))
}

/** Format a 0..1 model score as a percentage string. */
export function formatPercent(value, digits = 0) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${(Number(value) * 100).toFixed(digits)}%`
}

/** Compact large counts: 1234 -> 1.2K. */
export function formatCompact(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(Number(value))
}

/** Human-readable relative or absolute date. */
export function formatDate(value, opts = {}) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  }).format(d)
}

/**
 * Map a 0..1 risk score to a labelled band.
 * Thresholds are the documented defaults and are intended to be configurable
 * from Settings (see docs/model-evaluation.md). Never rely on color alone —
 * every band carries a text label.
 */
export const RISK_THRESHOLDS = { low: 0.25, medium: 0.5, high: 0.75 }

export function riskBand(score, thresholds = RISK_THRESHOLDS) {
  if (score == null || Number.isNaN(Number(score))) {
    return { key: 'unknown', label: 'Unavailable', tone: 'muted' }
  }
  const s = Number(score)
  if (s >= thresholds.high) return { key: 'critical', label: 'Critical', tone: 'critical' }
  if (s >= thresholds.medium) return { key: 'high', label: 'High', tone: 'high' }
  if (s >= thresholds.low) return { key: 'medium', label: 'Medium', tone: 'medium' }
  return { key: 'low', label: 'Low', tone: 'low' }
}
