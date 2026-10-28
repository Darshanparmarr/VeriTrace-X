import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Brain,
  Link2Off,
  Info,
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
import { StatusPill } from '@/components/ui/states'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Button } from '@/components/ui/button'
import { formatCompact, formatCurrency, formatPercent } from '@/lib/utils'
import {
  dashboardSummary,
  riskDistribution,
  riskTrend,
  recentTransactions,
  reviewActivity,
} from '@/services/demoData'

export default function Dashboard() {
  const navigate = useNavigate()
  const s = dashboardSummary

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of analyzed transactions, risk distribution, and review activity."
        actions={
          <Button onClick={() => navigate('/analyze')} className="gap-2">
            Analyze data
          </Button>
        }
      />

      {/* Demo-data disclosure — required: seeded figures must be labelled. */}
      <div className="mb-6 flex items-start gap-3 rounded-card border border-amber-soft/50 bg-amber-surface/50 px-4 py-3 text-sm text-amber-brown">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          These figures are <strong>seeded demo data</strong> for illustration. They are not live
          production statistics and the risk scores shown are not real model output. Run an analysis
          in <button className="font-semibold underline" onClick={() => navigate('/analyze')}>Analyze Data</button> to
          populate real results.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Transactions analyzed"
          value={formatCompact(s.analyzed)}
          hint="DataCo research dataset size"
          icon={BarChart3}
          tone="amber"
          to="/transactions"
          onClick={() => navigate('/transactions')}
        />
        <StatCard
          index={1}
          label="Requiring review"
          value={formatCompact(s.requiresReview)}
          hint="Flagged, awaiting a human decision"
          icon={AlertTriangle}
          tone="amber"
          onClick={() => navigate('/review')}
        />
        <StatCard
          index={2}
          label="High-risk transactions"
          value={formatCompact(s.highRisk)}
          hint="Model score in the Critical band"
          icon={ShieldAlert}
          tone="critical"
          onClick={() => navigate('/transactions?risk=critical')}
        />
        <StatCard
          index={3}
          label="Reviewed"
          value={formatCompact(s.reviewed)}
          hint="Decisions recorded by analysts"
          icon={CheckCircle2}
          tone="success"
          onClick={() => navigate('/review')}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Risk trend</CardTitle>
              <CardDescription>Flagged vs. reviewed over recent weeks</CardDescription>
            </div>
            <StatusPill tone="demo" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={riskTrend} margin={{ left: -16, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="gFlagged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gReviewed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #E7E5E4',
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="flagged" stroke="#F59E0B" strokeWidth={2} fill="url(#gFlagged)" name="Flagged" />
                <Area type="monotone" dataKey="reviewed" stroke="#059669" strokeWidth={2} fill="url(#gReviewed)" name="Reviewed" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk distribution</CardTitle>
            <CardDescription>Transactions by risk band</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskDistribution} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="band"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip
                  formatter={(v) => [formatCompact(v), 'Transactions']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {riskDistribution.map((d) => (
                    <Cell key={d.band} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {riskDistribution.map((d) => (
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

      {/* Lists */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent suspicious transactions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentTransactions.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/transactions/${t.id}`)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {t.id} · {t.product}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.supplier} · {t.location}
                  </p>
                </div>
                <span className="hidden text-sm font-medium tabular-nums text-foreground sm:block">
                  {formatCurrency(t.value)}
                </span>
                <RiskBadge score={t.score} showScore />
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
              {reviewActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber" />
                  <div>
                    <p className="text-foreground">
                      <span className="font-medium">{a.actor}</span> {a.action.toLowerCase()}{' '}
                      <span className="font-medium">{a.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{a.when}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <StatusRow icon={Brain} label="Model">
                <Badge variant="warning">Not trained yet</Badge>
              </StatusRow>
              <StatusRow icon={BarChart3} label="Data freshness">
                <span className="text-muted-foreground">No analysis run</span>
              </StatusRow>
              <StatusRow icon={Link2Off} label="Blockchain">
                <StatusPill tone="unavailable">Dev mode</StatusPill>
              </StatusRow>
              <p className="pt-1 text-xs text-muted-foreground">
                Suspected-fraud rate (research): {formatPercent(s.suspectedFraudRate, 2)}. This is
                dataset context, not a validated model metric.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
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
