import { createContext, useContext, useId, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const TabsContext = createContext(null)

export function Tabs({ defaultValue, value, onValueChange, className, children }) {
  const [internal, setInternal] = useState(defaultValue)
  const active = value ?? internal
  const setActive = (v) => {
    setInternal(v)
    onValueChange?.(v)
  }
  const groupId = useId()
  return (
    <TabsContext.Provider value={{ active, setActive, groupId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-border bg-muted/60 p-1',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, className, children }) {
  const ctx = useContext(TabsContext)
  const selected = ctx.active === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => ctx.setActive(value)}
      className={cn(
        'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'text-amber-brown' : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {selected && (
        <motion.span
          layoutId={`tab-${ctx.groupId}`}
          className="absolute inset-0 -z-10 rounded-lg bg-card shadow-sm"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }) {
  const ctx = useContext(TabsContext)
  if (ctx.active !== value) return null
  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('mt-4', className)}
    >
      {children}
    </motion.div>
  )
}
