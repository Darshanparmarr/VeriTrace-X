import { Menu, Search, Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/states'

/** Application top bar: menu toggle, search, service status, user. */
export function Topbar({ onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="relative hidden flex-1 md:block md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search order ID, supplier, product…"
          className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:border-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search transactions"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <StatusPill tone="demo" className="hidden sm:inline-flex" />
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-amber" />
        </Button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 text-sm hover:bg-muted"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-amber text-xs font-bold text-white">
            VX
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold leading-tight">Analyst</span>
            <span className="block text-[11px] leading-tight text-muted-foreground">Reviewer</span>
          </span>
          <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
        </button>
      </div>
    </header>
  )
}
