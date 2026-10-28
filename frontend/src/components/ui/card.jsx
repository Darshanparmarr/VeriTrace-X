import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Card = forwardRef(function Card({ className, interactive, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-card border border-border bg-card shadow-card',
        interactive &&
          'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  )
})

const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col gap-1 p-5', className)} {...props} />
})

const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
  return (
    <h3 ref={ref} className={cn('text-base font-semibold leading-tight', className)} {...props} />
  )
})

const CardDescription = forwardRef(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
})

const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
})

const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return (
    <div ref={ref} className={cn('flex items-center gap-2 p-5 pt-0', className)} {...props} />
  )
})

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
