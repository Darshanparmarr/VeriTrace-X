import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * KPI stat card. Pass `to` to make it a clickable link to a filtered view.
 * `tone` tints the icon chip; it never carries meaning alone.
 */
const TONE = {
  amber: 'bg-amber-surface text-amber-deep',
  success: 'bg-success/10 text-success',
  critical: 'bg-critical/10 text-critical',
  neutral: 'bg-muted text-muted-foreground',
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'amber', to, onClick, index = 0 }) {
  const clickable = Boolean(to || onClick)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        interactive={clickable}
        onClick={onClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        className="p-5"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          {Icon && (
            <div className={cn('flex size-10 items-center justify-center rounded-xl', TONE[tone])}>
              <Icon className="size-5" aria-hidden="true" />
            </div>
          )}
        </div>
        {clickable && (
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-deep">
            View details <ArrowUpRight className="size-3.5" />
          </div>
        )}
      </Card>
    </motion.div>
  )
}
