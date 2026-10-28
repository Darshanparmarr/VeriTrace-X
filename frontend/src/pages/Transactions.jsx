import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/states'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { api } from '@/services/api'
import { useApi } from '@/hooks/useApi'

const REVIEW_LABELS = {
  new: { label: 'New', variant: 'outline' },
  under_review: { label: 'Under review', variant: 'amber' },
  legitimate: { label: 'Legitimate', variant: 'success' },
  escalated: { label: 'Escalated', variant: 'warning' },
  confirmed_fraud: { label: 'Confirmed fraud', variant: 'critical' },
}
const RISK_FILTERS = ['all', 'low', 'medium', 'high', 'critical']
const PAGE_SIZE = 25

export default function Transactions() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [queryInput, setQueryInput] = useState(params.get('q') || '')
  const [page, setPage] = useState(1)

  const risk = params.get('risk') || 'all'
  const analysisId = params.get('analysis') || undefined
  const q = params.get('q') || ''

  // Reset to page 1 when filters change.
  useEffect(() => setPage(1), [risk, q, analysisId])

  const { data, loading, error, reload } = useApi(
    () =>
      api.listTransactions({
        page,
        page_size: PAGE_SIZE,
        risk: risk === 'all' ? undefined : risk,
        q: q || undefined,
        analysis_id: analysisId,
      }),
    [page, risk, q, analysisId],
  )

  function setParam(key, value) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next)
  }

  function submitSearch(e) {
    e.preventDefault()
    setParam('q', queryInput.trim())
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1
  const rows = data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Search, filter, and investigate scored supply-chain transactions."
        actions={analysisId && <Badge variant="amber">Analysis #{analysisId}</Badge>}
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search order ID, supplier, or product… (Enter)"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:border-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search transactions"
            />
          </form>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            {RISK_FILTERS.map((r) => (
              <button
                key={r}
                onClick={() => setParam('risk', r)}
                className={
                  'rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ' +
                  (risk === r ? 'bg-amber-surface text-amber-brown' : 'text-muted-foreground hover:bg-muted')
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        {error && !loading ? (
          <div className="p-6">
            <ErrorState title="Couldn't load transactions" description={error}
              action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>} />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="hidden md:table-cell">Product</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j}><Skeleton className="h-4" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : rows.map((t) => {
                      const review = REVIEW_LABELS[t.review_status] ?? REVIEW_LABELS.new
                      return (
                        <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/transactions/${t.id}`)}>
                          <TableCell className="font-semibold text-foreground">{t.order_id}</TableCell>
                          <TableCell>{t.supplier || '—'}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{t.product || '—'}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">{t.location || '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(t.order_value)}</TableCell>
                          <TableCell><RiskBadge score={t.risk_score} showScore /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Badge variant={review.variant}>{review.label}</Badge></TableCell>
                        </TableRow>
                      )
                    })}
              </TableBody>
            </Table>

            {!loading && rows.length === 0 && (
              <div className="p-6">
                <EmptyState icon={Search} title="No transactions match"
                  description="Try clearing the search or risk filter, or run an analysis first." />
              </div>
            )}
          </>
        )}
      </Card>

      {data && data.total > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {loading ? <Spinner className="size-3.5" /> : (
              <>Showing {(page - 1) * data.page_size + 1}–{Math.min(page * data.page_size, data.total)} of {data.total.toLocaleString()}</>
            )}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <span className="px-2">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
