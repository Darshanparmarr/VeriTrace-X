import { cn } from '@/lib/utils'

/** Loading placeholder. Pairs with the `.skeleton` shimmer in index.css. */
export function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton h-4 w-full', className)} {...props} />
}
