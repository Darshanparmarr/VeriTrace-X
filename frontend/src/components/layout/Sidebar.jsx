import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { NAV_GROUPS } from '@/config/nav'
import { cn } from '@/lib/utils'

function NavItem({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-amber-surface text-amber-brown'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn('size-[18px] shrink-0', isActive ? 'text-amber-deep' : 'text-muted-foreground group-hover:text-foreground')}
            aria-hidden="true"
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

/**
 * Compact application sidebar. On mobile it slides over as a drawer
 * controlled by `open` / `onClose`.
 */
export function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Primary navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <NavLink to="/dashboard" className="flex items-center" aria-label="VeriTrace-X home">
            <Logo className="h-7" />
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="scroll-amber flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.to} {...item} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-xl bg-amber-surface/60 px-3 py-2.5 text-xs text-amber-brown">
            <p className="font-semibold">Demo mode</p>
            <p className="mt-0.5 text-amber-brown/80">
              Figures shown are seeded demo data until you run an analysis.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
