import { cn } from '@/lib/utils'

/**
 * Brand mark. `variant="full"` shows the wordmark logo; `variant="mark"`
 * shows just the shield favicon (for collapsed sidebar / compact spots).
 */
export function Logo({ variant = 'full', className, alt = 'VeriTrace-X' }) {
  if (variant === 'mark') {
    return (
      <img
        src="/favicon.png"
        alt={alt}
        width={32}
        height={32}
        className={cn('h-8 w-8 select-none', className)}
      />
    )
  }
  return (
    <img
      src="/logo.png"
      alt={alt}
      className={cn('h-9 w-auto select-none', className)}
    />
  )
}
