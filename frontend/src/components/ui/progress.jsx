import { cn } from '@/lib/utils'

/** Determinate progress bar, 0..100. */
export function Progress({ value = 0, className, barClassName, ...props }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-border', className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full bg-amber transition-[width] duration-500', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
