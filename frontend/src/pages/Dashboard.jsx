import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Brain,
  Link2Off,
  ScanSearch,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Cell,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusPill, EmptyState, ErrorState } from '@/components/ui/states'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCompact, formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { api } from '@/services/api'
import { useApi } from '@/hooks/useApi'

const BAND_COLORS = { Low: '#059669', Medium: '#F59E0B', High: '#D97706', Critical: '#DC2626' }

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApi(() => api.dashboardSummary(), [])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of analyzed transactions, risk distribution, and review activity."
        actions={
          <Button onClick={() => navigate('/analyze')} className="gap-2">
            <ScanSearch className="size-4" /> Analyze data
          </Button>
        }
      />

      {loading && <DashboardSkeleton />}

      {error && !loading && (
        <ErrorState
          title="Couldn't load the dashboard"
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={reload}>
              Retry
            </Button>
          }
        />
      )}

      {data && !loading && data.is_demo && (
        <EmptyState
          icon={ScanSearch}
          title="No analysis yet"
          description="Upload a dataset and run an analysis to populate the dashboard with real risk scores and review activity."
          action={<Button onClick={() => navigate('/analyze')}>Analyze your first dataset</Button>}
        />
      )}

      {data && !loading && !data.is_demo && <DashboardContent data={data} navigate={navigate} />}
    </div>
  )
}

function DashboardContent({ data, navigate }) {
  const distribution = data.risk_distribution.map((d) => ({
    band: cap(d.band),
    count: d.count,
    color: BAND_COLORS[cap(d.band)],
  }))
  const histogram = data.score_histogram.map((b) => ({ bucket: b.bucket, count: b.count }))

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Transactions analyzed" value={formatCompact(data.analyzed)}
          icon={BarChart3} tone="amber" onClick={() => navigate('/transactions')} />
        <StatCard index={1} label="Requiring review" value={formatCompact(data.requires_review)}
          hint="Flagged, awaiting a decision" icon={AlertTriangle} tone="amber"
          onClick={() => navigate('/review')} />
        <StatCard index={2} label="High-risk" value={formatCompact(data.high_risk)}
          hint="High + Critical bands" icon={ShieldAlert} tone="critical"
          onClick={() => navigate('/transactions?risk=critical')} />
        <StatCard index={3} label="Reviewed" value={formatCompact(data.reviewed)}
          hint="Decisions recorded" icon={CheckCircle2} tone="success"
          onClick={() => navigate('/review')} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Risk-score distribution</CardTitle>
            <CardDescription>How model scores spread across analyzed orders</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={histogram} margin={{ left: -16, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="bucket" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} fill="url(#gScore)" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk distribution</CardTitle>
            <CardDescription>Transactions by band</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distribution} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="band" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} width={64} />
                <Tooltip formatter={(v) => [formatCompact(v), 'Transactions']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {distribution.map((d) => (
                    <Cell key={d.band} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {distribution.map((d) => (
                <div key={d.band} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.band}</span>
                  <span className="ml-auto font-medium">{formatCompact(d.count)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent suspicious transactions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.recent_transactions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing awaiting review.
              </p>
            )}
            {data.recent_transactions.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/transactions/${t.id}`)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {t.order_id}
                    {t.product ? ` · ${t.product}` : ''}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[t.supplier, t.location].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <span className="hidden text-sm font-medium tabular-nums text-foreground sm:block">
                  {formatCurrency(t.order_value)}
                </span>
                <RiskBadge score={t.risk_score} showScore />
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent review activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recent_reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">No review decisions yet.</p>
              )}
              {data.recent_reviews.map((a, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/transactions/${a.transaction_id}`)}
                  className="flex w-full items-start gap-3 text-left text-sm"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber" />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">
                      <span className="font-medium">{a.actor_name || 'Someone'}</span>{' '}
                      {a.decision.replace(/_/g, ' ')} <span className="font-medium">{a.order_id}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.created_at, { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <StatusRow icon={Brain} label="Model">
                <Badge variant={data.model_status === 'active' ? 'success' : 'warning'}>
                  {data.model_status === 'active' ? 'Active' : 'Not trained'}
                </Badge>
              </StatusRow>
              <StatusRow icon={Link2Off} label="Blockchain">
                <StatusPill tone="unavailable">Dev mode</StatusPill>
              </StatusRow>
              <p className="pt-1 text-xs text-muted-foreground">
                Suspected-fraud rate (research): {formatPercent(data.suspected_fraud_rate, 2)} — dataset
                context, not a validated model metric.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function StatusRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" /> {label}
      </span>
      {children}
    </div>
  )
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="h-72 lg:col-span-2" />
        <Card className="h-72" />
      </div>
    </div>
  )
}
