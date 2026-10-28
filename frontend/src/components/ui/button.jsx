import { forwardRef, cloneElement, isValidElement } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Amber is the product's primary identity — never blue.
        primary: 'bg-amber text-white shadow-sm hover:bg-amber-deep active:bg-amber-brown',
        secondary:
          'bg-amber-surface text-amber-brown hover:bg-amber-soft/60 border border-amber-soft/50',
        outline: 'border border-border bg-card text-foreground hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        danger: 'bg-critical text-white hover:bg-critical/90',
        success: 'bg-success text-white hover:bg-success/90',
        link: 'text-amber-deep underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

const Button = forwardRef(function Button(
  { className, variant, size, asChild = false, type = 'button', children, ...props },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size }), className)

  // asChild: render the single child element with button styles applied.
  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ref,
      className: cn(classes, children.props.className),
      ...props,
    })
  }

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  )
})

export { Button, buttonVariants }
