import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Table = forwardRef(function Table({ className, ...props }, ref) {
  return (
    <div className="w-full overflow-x-auto scroll-amber">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
})

const TableHeader = forwardRef(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
})

const TableBody = forwardRef(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
})

const TableRow = forwardRef(function TableRow({ className, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/60 data-[state=selected]:bg-amber-surface/40',
        className,
      )}
      {...props}
    />
  )
})

const TableHead = forwardRef(function TableHead({ className, ...props }, ref) {
  return (
    <th
      ref={ref}
      className={cn(
        'h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
})

const TableCell = forwardRef(function TableCell({ className, ...props }, ref) {
  return <td ref={ref} className={cn('px-4 py-3 align-middle', className)} {...props} />
})

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
