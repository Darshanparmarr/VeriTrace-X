import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

/** Empty state with optional icon, title, description and action. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-card/50 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-amber-surface text-amber-deep">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Inline spinner. */
export function Spinner({ className }) {
  return <Loader2 className={cn('size-4 animate-spin', className)} aria-hidden="true" />
}

/**
 * Service status pill. tone: online | degraded | unavailable | demo.
 * Uses a text label + dot — not color alone.
 */
const STATUS = {
  online: { dot: 'bg-success', text: 'text-success', label: 'Online' },
  degraded: { dot: 'bg-amber', text: 'text-amber-deep', label: 'Degraded' },
  unavailable: { dot: 'bg-critical', text: 'text-critical', label: 'Unavailable' },
  demo: { dot: 'bg-amber-deep', text: 'text-amber-deep', label: 'Demo data' },
}

export function StatusPill({ tone = 'online', children, className }) {
  const s = STATUS[tone] ?? STATUS.online
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium',
        s.text,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden="true" />
      {children ?? s.label}
    </span>
  )
}

/** Full-width error state. */
export function ErrorState({ title = 'Something went wrong', description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-critical/20 bg-critical/5 px-6 py-10 text-center',
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-critical">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
