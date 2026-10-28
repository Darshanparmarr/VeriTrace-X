import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Factory,
  Truck,
  MapPin,
  Package,
  Route as RouteIcon,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { api } from '@/services/api'
import { useApi } from '@/hooks/useApi'

export default function Traceability() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const txId = params.get('tx')

  const { data: trace, loading, error } = useApi(
    () => (txId ? api.traceTransaction(txId) : Promise.resolve(null)),
    [txId],
  )

  return (
    <div>
      <PageHeader
        title="Supply Chain Traceability"
        description="Trace an order from origin to delivery with its milestones, related orders, and audit events."
        actions={txId && <Button variant="ghost" size="sm" onClick={() => setParams({})}>Choose another</Button>}
      />

      {!txId && <Picker onPick={(id) => setParams({ tx: String(id) })} />}

      {txId && loading && <Skeleton className="h-96 rounded-card" />}
      {txId && error && <ErrorState title="Couldn't load trace" description={error} />}
      {txId && trace && <TraceView trace={trace} navigate={navigate} />}
    </div>
  )
}

function Picker({ onPick }) {
  const { data, loading } = useApi(() => api.listTransactions({ page_size: 8 }), [])
  const items = data?.items ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a transaction to trace</CardTitle>
        <CardDescription>Pick a recent order, or open any order's detail and use its region.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        {!loading && items.length === 0 && (
          <EmptyState icon={RouteIcon} title="No transactions yet" description="Run an analysis first." />
        )}
        {items.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-shadow hover:shadow-card"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{t.order_id}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[t.product, t.location].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <RiskBadge score={t.risk_score} />
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

function TraceView({ trace, navigate }) {
  const tx = trace.transaction
  const f = tx.features || {}
  const scheduled = f.days_shipping_scheduled
  const real = f.days_shipping_real

  const milestones = [
    { icon: Factory, label: 'Order origin', place: tx.supplier || 'Supplier', sub: f.payment_type ? `Payment: ${f.payment_type}` : null },
    { icon: Truck, label: 'In transit', place: tx.location || 'Region', sub: scheduled != null ? `Scheduled ${fmt(scheduled)} day(s)` : null },
    { icon: Package, label: 'Delivered', place: tx.location || '—', sub: real != null ? `Actual ${fmt(real)} day(s)` : null },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Order {tx.order_id}</CardTitle>
            <CardDescription>
              {[tx.product, tx.supplier].filter(Boolean).join(' · ') || 'Transaction'} · {formatCurrency(tx.order_value)}
            </CardDescription>
          </div>
          <RiskBadge score={tx.risk_score} showScore />
        </CardHeader>
        <CardContent>
          <ol className="relative ml-3 border-l border-border">
            {milestones.map((m, i) => (
              <li key={i} className="mb-7 ml-6 last:mb-0">
                <span className="absolute -left-3 flex size-6 items-center justify-center rounded-full bg-amber-surface ring-4 ring-background">
                  <m.icon className="size-3.5 text-amber-deep" />
                </span>
                <p className="text-sm font-semibold text-foreground">{m.label}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {m.place}
                  {m.sub && <span className="ml-1">· {m.sub}</span>}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            Journey is derived from this order's real fields. Milestone-level GPS tracking and a map
            are only shown when the data contains them — we don't invent positions or events.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Related orders</CardTitle>
            <CardDescription>Same region or supplier in this analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {trace.related.length === 0 && <p className="text-sm text-muted-foreground">No related orders found.</p>}
            {trace.related.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/transactions/${t.id}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-left hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.order_id}</span>
                <span className="text-xs text-muted-foreground">{formatCurrency(t.order_value)}</span>
                <RiskBadge score={t.risk_score} />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Audit events</CardTitle>
              <CardDescription>Tamper-evident records for this order</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/audit')}>Open audit</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {trace.audit_events.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No audit events yet — record a review decision to create one.
              </p>
            )}
            {trace.audit_events.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
                <ShieldCheck className="size-4 text-amber-deep" />
                <span className="flex-1 truncate">{e.event_type.replace(/_/g, ' ')}</span>
                <Badge variant="outline" className="font-mono text-[10px]">{e.chain_hash.slice(0, 10)}…</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function fmt(v) {
  if (v == null) return '—'
  return typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(1) : String(v)
}
