import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RiskBadge } from './risk-badge'

describe('RiskBadge', () => {
  it('renders a text label for each band (never color-only)', () => {
    const { rerender } = render(<RiskBadge score={0.1} />)
    expect(screen.getByText('Low')).toBeInTheDocument()
    rerender(<RiskBadge score={0.9} />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('shows an explicit unavailable state for a null score', () => {
    render(<RiskBadge score={null} />)
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  it('optionally shows the numeric score', () => {
    render(<RiskBadge score={0.87} showScore />)
    expect(screen.getByText('87')).toBeInTheDocument()
  })
})
