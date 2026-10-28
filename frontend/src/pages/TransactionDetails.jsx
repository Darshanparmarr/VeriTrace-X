import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Package,
  MapPin,
  CalendarClock,
  Info,
  Link2Off,
  AlertTriangle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RiskGauge } from '@/components/ui/risk-gauge'
import { StatusPill, EmptyState, ErrorState, Spinner } from '@/components/ui/states'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewPanel } from '@/components/review/ReviewPanel'
import { formatCurrency } from '@/lib/utils'
import { api } from '@/services/api'
import { useApi } from '@/hooks/useApi'

const FEATURE_LABELS = {
  payment_type: 'Payment type',
  order_value: 'Order value',
  quantity: 'Quantity',
  discount_rate: 'Discount rate',
  days_shipping_real: 'Actual shipping days',
  days_shipping_scheduled: 'Scheduled shipping days',
  shipping_delay: 'Shipping delay',
  product_name: 'Product',
  category_name: 'Category',
  customer_segment: 'Customer segment',
  order_region: 'Order region',
  shipping_mode: 'Shipping mode',
}

export default function TransactionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: tx, loading, error } = useApi(() => api.getTransaction(id), [id])
  const { data: explanation } = useApi(() => api.getExplanation(id), [id])
  const [statusOverride, setStatusOverride] = useState(null)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="h-96 lg:col-span-2" />
          <Card className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !tx) {
    return (
      <div>
        <BackLink navigate={navigate} />
        <ErrorState title="Transaction not found" description={error || 'It may have been removed.'} />
      </div>
    )
  }

  return (
    <div>
      <BackLink navigate={navigate} />
      <PageHeader
        title={`Order ${tx.order_id}`}
        description={[tx.product, tx.supplier].filter(Boolean).join(' · ') || 'Transaction detail'}
        actions={<Badge variant="outline">{(statusOverride || tx.review_status).replace(/_/g, ' ')}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="explanation">
            <TabsList>
              <TabsTrigger value="explanation">Explanation</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Shipment</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="explanation">
              <ExplanationView explanation={explanation} />
            </TabsContent>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Order summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field icon={Package} label="Product" value={tx.product} />
                  <Field icon={Building2} label="Supplier / segment" value={tx.supplier} />
                  <Field icon={MapPin} label="Region" value={tx.location} />
                  <Field icon={CalendarClock} label="Order value" value={formatCurrency(tx.order_value)} />
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Relevant transaction data</CardTitle>
                  <CardDescription>Fields the model considered</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {tx.features
                    ? Object.entries(tx.features)
                        .filter(([k]) => FEATURE_LABELS[k])
                        .map(([k, v]) => (
                          <DataPoint key={k} label={FEATURE_LABELS[k]} value={fmt(v)} />
                        ))
                    : <p className="text-muted-foreground">No stored features.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <ShipmentView features={tx.features} />
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Blockchain audit</CardTitle>
                    <CardDescription>Tamper-evident record verification</CardDescription>
                  </div>
                  <StatusPill tone="unavailable">Blockchain unavailable</StatusPill>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
                    <Link2Off className="mt-0.5 size-5 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">No on-chain record yet</p>
                      <p className="mt-1 text-muted-foreground">
                        The blockchain integration runs in development mode. Audit events are anchored
                        to a real Hyperledger Fabric network once configured (Phase 5). We never display
                        a fake successful verification.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk score</CardTitle>
              <CardDescription>Model output for this order</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <RiskGauge score={tx.risk_score} />
              <p className="mt-4 text-center text-xs text-muted-foreground">
                The score is the model's estimated likelihood that this order warrants review — an
                uncalibrated signal, not a confirmed probability of fraud, and separate from model
                confidence.
              </p>
            </CardContent>
          </Card>

          <ReviewPanel transactionId={tx.id} onStatusChange={setStatusOverride} />
        </div>
      </div>
    </div>
  )
}

function ExplanationView({ explanation }) {
  if (!explanation) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Spinner /> Generating explanation…
        </CardContent>
      </Card>
    )
  }
  if (!explanation.available) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState icon={Info} title="Explanation unavailable" description={explanation.note} />
        </CardContent>
      </Card>
    )
  }

  const contribs = explanation.contributions.map((c) => ({
    feature: c.label,
    value: c.value,
    direction: c.direction,
  }))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Why was this order flagged?</CardTitle>
          <CardDescription>Plain-English summary of the biggest factors</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {explanation.summary.map((w, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-deep" />
                {w}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">{explanation.note}</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Feature contributions</CardTitle>
            <CardDescription>SHAP local explanation</CardDescription>
          </div>
          <Badge variant="outline">{explanation.method?.toUpperCase() || 'SHAP'}</Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(200, contribs.length * 34)}>
            <BarChart layout="vertical" data={contribs} margin={{ left: 8, right: 24 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="feature" width={150} tickLine={false} axisLine={false} fontSize={11} stroke="#64748B" />
              <Tooltip formatter={(v) => [Number(v).toFixed(4), 'Contribution']}
                contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 12 }} />
              <ReferenceLine x={0} stroke="#E7E5E4" />
              <Bar dataKey="value" radius={4}>
                {contribs.map((d) => (
                  <Cell key={d.feature} fill={d.value >= 0 ? '#D97706' : '#059669'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-amber-deep" /> Increases risk</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-success" /> Decreases risk</span>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function ShipmentView({ features }) {
  const scheduled = features?.days_shipping_scheduled
  const real = features?.days_shipping_real
  const delay = features?.shipping_delay
  const hasData = scheduled != null || real != null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment</CardTitle>
        <CardDescription>Derived from the order's shipping fields</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Scheduled days" value={fmt(scheduled)} />
            <Stat label="Actual days" value={fmt(real)} />
            <Stat
              label="Delay"
              value={fmt(delay)}
              tone={delay > 0 ? 'bad' : 'good'}
            />
          </div>
        ) : (
          <EmptyState title="No shipment fields" description="This order has no shipping-day data." />
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Milestone-level tracking and a map arrive with full traceability (Phase 5). We don't invent
          locations or events the data doesn't contain.
        </p>
      </CardContent>
    </Card>
  )
}

function BackLink({ navigate }) {
  return (
    <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Back
    </button>
  )
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-amber-surface text-amber-deep">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value || '—'}</p>
      </div>
    </div>
  )
}

function DataPoint({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  )
}

function Stat({ label, value, tone }) {
  const color = tone === 'bad' ? 'text-critical' : tone === 'good' ? 'text-success' : 'text-foreground'
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function fmt(v) {
  if (v == null) return '—'
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2)
  return String(v)
}
