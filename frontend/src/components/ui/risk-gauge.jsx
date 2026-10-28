import { riskBand } from '@/lib/utils'
import { RiskBadge } from './risk-badge'

const BAND_COLOR = {
  low: '#059669',
  medium: '#F59E0B',
  high: '#D97706',
  critical: '#DC2626',
  unknown: '#CBD5E1',
}

/**
 * RiskGauge — semicircular gauge for a 0..1 model score.
 * The number and label are always legible without relying on color.
 * `score` of null/undefined renders an explicit "Unavailable" state.
 */
export function RiskGauge({ score, size = 180, label = 'Risk score' }) {
  const available = score != null && !Number.isNaN(Number(score))
  const band = riskBand(available ? score : null)
  const color = BAND_COLOR[band.key] ?? BAND_COLOR.unknown

  const r = size / 2 - 14
  const cx = size / 2
  const cy = size / 2
  const circumference = Math.PI * r // half circle
  const pct = available ? Math.max(0, Math.min(1, Number(score))) : 0
  const dash = circumference * pct

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${available ? Math.round(pct * 100) : 'unavailable'}`}>
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {/* track */}
        <path
          d={describeArc(cx, cy, r)}
          fill="none"
          stroke="#E7E5E4"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* value */}
        {available && (
          <path
            d={describeArc(cx, cy, r)}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        )}
      </svg>
      <div className="-mt-10 flex flex-col items-center">
        <span className="font-mono text-4xl font-bold text-foreground">
          {available ? Math.round(pct * 100) : '—'}
          {available && <span className="text-xl text-muted-foreground">/100</span>}
        </span>
        <div className="mt-2">
          {available ? (
            <RiskBadge score={score} />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">Prediction unavailable</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Half-circle arc path from 180° to 0°.
function describeArc(cx, cy, r) {
  const start = { x: cx - r, y: cy }
  const end = { x: cx + r, y: cy }
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`
}
