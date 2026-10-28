import { Construction } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * Honest placeholder for functionality scheduled in a later build phase.
 * Keeps navigation consistent without pretending a feature is finished.
 */
export function PhaseNotice({ phase, children }) {
  return (
    <div className="rounded-card border border-dashed border-amber-soft/60 bg-amber-surface/40 p-6">
      <div className="flex items-center gap-2">
        <Construction className="size-5 text-amber-deep" />
        <Badge variant="warning">Planned · Phase {phase}</Badge>
      </div>
      <div className="mt-3 text-sm text-amber-brown/90">{children}</div>
    </div>
  )
}
