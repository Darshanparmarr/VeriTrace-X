import { ShieldCheck, ShieldAlert, AlertTriangle, ShieldX, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { riskBand } from '@/lib/utils'

// Each band pairs an icon + text label so risk is never communicated by color alone.
const BAND_STYLES = {
  low: { cls: 'border-success/25 bg-success/10 text-success', Icon: ShieldCheck },
  medium: { cls: 'border-amber-deep/25 bg-amber/10 text-amber-deep', Icon: ShieldAlert },
  high: { cls: 'border-amber-deep/30 bg-amber-deep/10 text-amber-brown', Icon: AlertTriangle },
  critical: { cls: 'border-critical/25 bg-critical/10 text-critical', Icon: ShieldX },
  unknown: { cls: 'border-border bg-muted text-muted-foreground', Icon: HelpCircle },
}

/**
 * RiskBadge — renders the risk band label with icon.
 * Pass either a `score` (0..1) or an explicit `band` key.
 */
export function RiskBadge({ score, band, showScore = false, className }) {
  const resolved = band ? { key: band, label: labelFor(band) } : riskBand(score)
  const { cls, Icon } = BAND_STYLES[resolved.key] ?? BAND_STYLES.unknown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        cls,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {resolved.label}
      {showScore && score != null && (
        <span className="font-mono text-[11px] opacity-80">{(score * 100).toFixed(0)}</span>
      )}
    </span>
  )
}

function labelFor(key) {
  return { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical', unknown: 'Unavailable' }[
    key
  ]
}
