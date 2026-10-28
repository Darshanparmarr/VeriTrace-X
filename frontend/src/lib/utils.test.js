import { describe, it, expect } from 'vitest'
import { riskBand, formatCurrency, formatPercent, RISK_THRESHOLDS } from './utils'

describe('riskBand', () => {
  it('maps scores to the documented bands', () => {
    expect(riskBand(0.1).key).toBe('low')
    expect(riskBand(0.3).key).toBe('medium')
    expect(riskBand(0.6).key).toBe('high')
    expect(riskBand(0.9).key).toBe('critical')
  })

  it('returns an explicit unavailable band for null/invalid', () => {
    expect(riskBand(null).key).toBe('unknown')
    expect(riskBand(undefined).label).toBe('Unavailable')
    expect(riskBand(NaN).tone).toBe('muted')
  })

  it('honours the boundary thresholds', () => {
    expect(riskBand(RISK_THRESHOLDS.high).key).toBe('critical')
    expect(riskBand(RISK_THRESHOLDS.medium).key).toBe('high')
    expect(riskBand(RISK_THRESHOLDS.low).key).toBe('medium')
  })
})

describe('formatters', () => {
  it('formats currency and percent, with em-dash fallbacks', () => {
    expect(formatCurrency(48200)).toContain('48,200')
    expect(formatPercent(0.0225, 2)).toBe('2.25%')
    expect(formatCurrency(null)).toBe('—')
    expect(formatPercent(undefined)).toBe('—')
  })
})
