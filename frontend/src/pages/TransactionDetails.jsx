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
  Truck,
  Factory,
  Warehouse,
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
import { StatusPill } from '@/components/ui/states'
import { ReviewPanel } from '@/components/review/ReviewPanel'
import { formatCurrency } from '@/lib/utils'
import { recentTransactions } from '@/services/demoData'

// Illustrative SHAP-style contributions for the sample order (NOT real model output).
const DEMO_CONTRIBUTIONS = [
  { feature: 'Order value vs. category median', value: 0.34 },
  { feature: 'Supplier transaction history (limited)', value: 0.21 },
  { feature: 'Shipping mode vs. order type mismatch', value: 0.14 },
  { feature: 'Destination region risk', value: 0.08 },
  { feature: 'Discount rate', value: -0.06 },
  { feature: 'Days to ship (on schedule)', value: -0.11 },
]

const DEMO_WHY = [
  'The order value is unusually high compared with other orders in the same product category.',
  'The supplier has limited historical transaction data in the dataset.',
  'The shipping mode does not match the typical pattern for this order type.',
]

const DEMO_TIMELINE = [
  { icon: Factory, label: 'Order placed at supplier', place: 'Northwind Traders', when: 'Day 0' },
  { icon: Truck, label: 'Picked up for transit', place: 'Carrier hub', when: 'Day 1' },
  { icon: Warehouse, label: 'Arrived at warehouse', place: 'Los Angeles DC', when: 'Day 3' },
  { icon: Package, label: 'Out for delivery', place: 'Los Angeles, US', when: 'Day 4' },
]

export default function TransactionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tx = recentTransactions.find((t) => t.id === id) ?? recentTransactions[0]

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <PageHeader
        title={`Order ${tx.id}`}
        description={`${tx.product} · ${tx.supplier}`}
        actions={<StatusPill tone="demo" />}
      />

      {/* Illustrative disclosure — required for the VX-1024 example. */}
      <div className="mb-6 flex items-start gap-3 rounded-card border border-amber-soft/50 bg-amber-surface/50 px-4 py-3 text-sm text-amber-brown">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          This is an <strong>illustrative example</strong>. The risk score, contributions, and
          explanation shown here are placeholders to demonstrate the layout — they are not real model
          output. Live values are generated once the model (Phase 3) is wired in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="explanation">Explanation</TabsTrigger>
              <TabsTrigger value="timeline">Shipment</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Order summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field icon={Package} label="Product" value={tx.product} />
                  <Field icon={Building2} label="Supplier" value={tx.supplier} />
                  <Field icon={MapPin} label="Destination" value={tx.location} />
                  <Field icon={CalendarClock} label="Order value" value={formatCurrency(tx.value)} />
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Relevant transaction data</CardTitle>
                  <CardDescription>Fields the model considered</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <DataPoint label="Order type" value="Standard" />
                  <DataPoint label="Shipping mode" value="Same-day" />
                  <DataPoint label="Payment" value="Transfer" />
                  <DataPoint label="Discount" value="2%" />
                  <DataPoint label="Qty" value="12" />
                  <DataPoint label="Days to ship" value="4" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Explanation */}
            <TabsContent value="explanation">
              <Card>
                <CardHeader>
                  <CardTitle>Why was this order flagged?</CardTitle>
                  <CardDescription>
                    Plain-English summary of the factors with the largest influence.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {DEMO_WHY.map((w) => (
                      <li key={w} className="flex gap-2.5 text-sm text-foreground">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-deep" />
                        {w}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                    These factors describe model <em>contribution</em>, not proof of wrongdoing.
                    Correlation shown here is not causal evidence of fraud.
                  </p>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Feature contributions</CardTitle>
                    <CardDescription>SHAP-style local explanation (illustrative)</CardDescription>
                  </div>
                  <Badge variant="outline">SHAP</Badge>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      layout="vertical"
                      data={DEMO_CONTRIBUTIONS}
                      margin={{ left: 8, right: 24 }}
                    >
                      <XAxis type="number" domain={[-0.2, 0.4]} hide />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        width={210}
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        stroke="#64748B"
                      />
                      <Tooltip
                        formatter={(v) => [Number(v).toFixed(2), 'Contribution']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 12 }}
                      />
                      <ReferenceLine x={0} stroke="#E7E5E4" />
                      <Bar dataKey="value" radius={4}>
                        {DEMO_CONTRIBUTIONS.map((d) => (
                          <Cell key={d.feature} fill={d.value >= 0 ? '#D97706' : '#059669'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-amber-deep" /> Increases risk
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-success" /> Decreases risk
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Shipment timeline</CardTitle>
                  <CardDescription>Milestones recorded for this order</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="relative ml-3 border-l border-border">
                    {DEMO_TIMELINE.map((m, i) => (
                      <li key={i} className="mb-6 ml-6 last:mb-0">
                        <span className="absolute -left-3 flex size-6 items-center justify-center rounded-full bg-amber-surface ring-4 ring-background">
                          <m.icon className="size-3.5 text-amber-deep" />
                        </span>
                        <p className="text-sm font-semibold text-foreground">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.place} · {m.when}</p>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Milestones are only shown when present in the underlying data — positions are not
                    invented.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit */}
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
                        The blockchain integration is running in development mode. Audit events are
                        anchored to a real Hyperledger Fabric network once configured (Phase 5). We
                        never display a fake successful verification.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk score</CardTitle>
              <CardDescription>Model output for this order</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <RiskGauge score={tx.score} />
              <p className="mt-4 text-center text-xs text-muted-foreground">
                The score is the model's estimated likelihood that this order warrants review. It is
                an uncalibrated signal — not a confirmed probability of fraud, and separate from model
                confidence.
              </p>
            </CardContent>
          </Card>

          <ReviewPanel transactionId={tx.id} />
        </div>
      </div>
    </div>
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
        <p className="text-sm font-semibold text-foreground">{value}</p>
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
