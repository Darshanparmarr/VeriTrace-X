import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted text-foreground',
        amber: 'border-amber-soft/60 bg-amber-surface text-amber-brown',
        success: 'border-success/20 bg-success/10 text-success',
        critical: 'border-critical/20 bg-critical/10 text-critical',
        warning: 'border-amber-deep/20 bg-amber/10 text-amber-deep',
        outline: 'border-border bg-transparent text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
