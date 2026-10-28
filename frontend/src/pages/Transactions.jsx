import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Badge } from '@/components/ui/badge'
import { StatusPill, EmptyState } from '@/components/ui/states'
import { formatCurrency, riskBand } from '@/lib/utils'
import { recentTransactions } from '@/services/demoData'

const REVIEW_LABELS = {
  new: { label: 'New', variant: 'outline' },
  under_review: { label: 'Under review', variant: 'amber' },
  legitimate: { label: 'Legitimate', variant: 'success' },
  escalated: { label: 'Escalated', variant: 'warning' },
  confirmed_fraud: { label: 'Confirmed fraud', variant: 'critical' },
}

const RISK_FILTERS = ['all', 'low', 'medium', 'high', 'critical']

export default function Transactions() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sortDesc, setSortDesc] = useState(true)
  const riskFilter = params.get('risk') || 'all'

  const rows = useMemo(() => {
    let data = recentTransactions.filter((t) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.supplier.toLowerCase().includes(q) ||
        t.product.toLowerCase().includes(q)
      const matchesRisk = riskFilter === 'all' || riskBand(t.score).key === riskFilter
      return matchesQuery && matchesRisk
    })
    data = [...data].sort((a, b) => (sortDesc ? b.score - a.score : a.score - b.score))
    return data
  }, [query, riskFilter, sortDesc])

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Search, filter, and investigate scored supply-chain transactions."
        actions={<StatusPill tone="demo" />}
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order ID, supplier, or product…"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:border-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search transactions"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            {RISK_FILTERS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  const next = new URLSearchParams(params)
                  if (r === 'all') next.delete('risk')
                  else next.set('risk', r)
                  setParams(next)
                }}
                className={
                  'rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ' +
                  (riskFilter === r
                    ? 'bg-amber-surface text-amber-brown'
                    : 'text-muted-foreground hover:bg-muted')
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="hidden md:table-cell">Product</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => setSortDesc((v) => !v)}
                >
                  Risk <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const review = REVIEW_LABELS[t.status] ?? REVIEW_LABELS.new
              return (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/transactions/${t.id}`)}
                >
                  <TableCell className="font-semibold text-foreground">{t.id}</TableCell>
                  <TableCell>{t.supplier}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{t.product}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{t.location}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(t.value)}</TableCell>
                  <TableCell><RiskBadge score={t.score} showScore /></TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={review.variant}>{review.label}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={Search}
              title="No transactions match"
              description="Try clearing the search or risk filter."
            />
          </div>
        )}
      </Card>

      <p className="mt-3 text-xs text-muted-foreground">
        Showing {rows.length} demo transactions. Server-side pagination, date and supplier filters,
        and real scored data arrive with the backend (Phase 2) and model (Phase 3).
      </p>
    </div>
  )
}
