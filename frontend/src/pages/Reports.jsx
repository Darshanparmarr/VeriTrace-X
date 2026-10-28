import { useState } from 'react'
import { FileBarChart, Download, Printer, ShieldAlert, CheckCircle2, FlaskConical } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/states'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCompact, formatPercent } from '@/lib/utils'
import { api, ApiError } from '@/services/api'
import { useApi } from '@/hooks/useApi'

export default function Reports() {
  const { data, loading, error, reload } = useApi(() => api.reportSummary(), [])
  const [downloading, setDownloading] = useState(null)
  const [dlError, setDlError] = useState('')

  async function download(kind, filename) {
    setDownloading(kind)
    setDlError('')
    try {
      await api.downloadReport(kind, filename)
    } catch (e) {
      setDlError(e instanceof ApiError ? e.message : 'Download failed')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Summaries and exports generated from real stored results."
        actions={
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="size-4" /> Print
          </Button>
        }
      />

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
      )}

      {error && !loading && (
        <ErrorState title="Couldn't load reports" description={error}
          action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>} />
      )}

      {data && !loading && data.total_transactions === 0 && (
        <EmptyState icon={FileBarChart} title="Nothing to report yet"
          description="Run an analysis to generate fraud-risk and review reports." />
      )}

      {data && !loading && data.total_transactions > 0 && (
        <div className="space-y-6">
          {/* Fraud-risk summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Transactions" value={formatCompact(data.total_transactions)} icon={FileBarChart} />
            <Stat label="Flagged (High+Critical)" value={formatCompact(data.flagged)} icon={ShieldAlert} tone="critical" />
            <Stat label="Reviewed" value={formatCompact(sumReviewed(data.review_outcomes))} icon={CheckCircle2} tone="success" />
            <Stat label="Avg risk score"
              value={data.average_risk_score == null ? '—' : formatPercent(data.average_risk_score, 0)}
              icon={FileBarChart} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fraud-risk distribution</CardTitle>
                <CardDescription>Transactions by risk band</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(data.risk_distribution).map(([band, count]) => (
                  <DistRow key={band} label={cap(band)} value={count} total={data.total_transactions} />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review outcomes</CardTitle>
                <CardDescription>Decisions recorded by reviewers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(data.review_outcomes).map(([status, count]) => (
                  <DistRow key={status} label={labelStatus(status)} value={count} total={data.total_transactions} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Model performance */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Model performance</CardTitle>
                <CardDescription>
                  {data.model.algorithm || '—'} · {data.model.version || 'not trained'}
                </CardDescription>
              </div>
              {data.model.is_synthetic && (
                <Badge variant="warning" className="gap-1"><FlaskConical className="size-3" /> Synthetic</Badge>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {data.model.test_metrics ? (
                <>
                  <Metric label="ROC-AUC" value={data.model.test_metrics.roc_auc} />
                  <Metric label="PR-AUC" value={data.model.test_metrics.pr_auc} />
                  <Metric label="Precision" value={data.model.test_metrics.precision} />
                  <Metric label="Recall" value={data.model.test_metrics.recall} />
                  <Metric label="F1" value={data.model.test_metrics.f1} />
                </>
              ) : (
                <p className="col-span-full text-sm text-muted-foreground">No trained model metrics available.</p>
              )}
            </CardContent>
          </Card>

          {/* Exports */}
          <Card>
            <CardHeader>
              <CardTitle>Export</CardTitle>
              <CardDescription>CSV downloads are protected against spreadsheet formula injection.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={downloading === 'transactions'}
                onClick={() => download('transactions', 'veritrace_transactions.csv')} className="gap-2">
                {downloading === 'transactions' ? <Spinner /> : <Download className="size-4" />} Transactions CSV
              </Button>
              <Button variant="outline" disabled={downloading === 'reviews'}
                onClick={() => download('reviews', 'veritrace_reviews.csv')} className="gap-2">
                {downloading === 'reviews' ? <Spinner /> : <Download className="size-4" />} Review outcomes CSV
              </Button>
              {dlError && <p className="w-full text-sm text-critical">{dlError}</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, icon: Icon, tone = 'amber' }) {
  const tones = { amber: 'bg-amber-surface text-amber-deep', critical: 'bg-critical/10 text-critical', success: 'bg-success/10 text-success' }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </Card>
  )
}

function DistRow({ label, value, total }) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{formatCompact(value)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-bold text-foreground">{value == null ? '—' : Number(value).toFixed(3)}</p>
    </div>
  )
}

function sumReviewed(outcomes) {
  return ['legitimate', 'escalated', 'confirmed_fraud'].reduce((a, k) => a + (outcomes[k] || 0), 0)
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1) }
function labelStatus(s) {
  return { new: 'New', under_review: 'Under review', legitimate: 'Legitimate', escalated: 'Escalated', confirmed_fraud: 'Confirmed fraud' }[s] || s
}
