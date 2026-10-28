import { useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from 'recharts'
import { Brain, FlaskConical, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState, StatusPill } from '@/components/ui/states'
import { api, ApiError } from '@/services/api'
import { formatPercent, formatDate } from '@/lib/utils'

export default function Explainability() {
  const [card, setCard] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | notrained | error
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api
      .modelCard()
      .then((c) => {
        if (!active) return
        setCard(c)
        setState(c.status === 'active' ? 'ready' : 'notrained')
      })
      .catch((e) => {
        if (!active) return
        setError(e instanceof ApiError ? e.message : 'Failed to load model card')
        setState('error')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        title="Explainable AI"
        description="How the model behaves overall, and why individual orders get flagged — in plain English."
        actions={
          card?.is_synthetic ? (
            <Badge variant="warning" className="gap-1">
              <FlaskConical className="size-3" /> Trained on synthetic data
            </Badge>
          ) : card?.status === 'active' ? (
            <StatusPill tone="online">Model active</StatusPill>
          ) : null
        }
      />

      {state === 'loading' && <LoadingSkeleton />}

      {state === 'error' && (
        <ErrorState title="Couldn't load the model" description={error} />
      )}

      {state === 'notrained' && (
        <EmptyState
          icon={Brain}
          title="No trained model yet"
          description="Train a model to populate global importance, metrics, and explanations. Run `python -m veritrace_ml.train` in the ml/ directory."
        />
      )}

      {state === 'ready' && card && <ModelView card={card} />}
    </div>
  )
}

function ModelView({ card }) {
  const metrics = card.metrics || {}
  const test = metrics.test || metrics.validation || {}
  const importance = (card.global_importance || []).map((d) => ({
    feature: d.label || d.feature,
    value: d.importance,
  }))

  return (
    <div className="space-y-6">
      {card.is_synthetic && (
        <div className="flex items-start gap-3 rounded-card border border-amber-soft/50 bg-amber-surface/50 px-4 py-3 text-sm text-amber-brown">
          <FlaskConical className="mt-0.5 size-4 shrink-0" />
          <p>
            This model was trained on <strong>synthetic data</strong>, so the metrics below are
            illustrative of the pipeline — not real-world performance. Drop the real DataCo CSV into{' '}
            <code className="rounded bg-amber-surface px-1">ml/data/raw/</code> and retrain to get
            real numbers.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Global feature importance</CardTitle>
              <CardDescription>Mean |SHAP| — which inputs most influence risk</CardDescription>
            </div>
            <Badge variant="outline">{(card.metrics && 'SHAP') || 'SHAP'}</Badge>
          </CardHeader>
          <CardContent>
            {importance.length === 0 ? (
              <EmptyState title="No importance data" />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(260, importance.length * 28)}>
                <BarChart layout="vertical" data={importance} margin={{ left: 8, right: 24 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    width={150}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="#64748B"
                  />
                  <Tooltip
                    formatter={(v) => [Number(v).toFixed(4), 'Mean |SHAP|']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {importance.map((d, i) => (
                      <Cell key={d.feature} fill={i === 0 ? '#D97706' : '#F59E0B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model card</CardTitle>
              <CardDescription>Active version</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Algorithm" value={card.algorithm} />
              <Row label="Version" value={card.version} mono />
              <Row label="Trained" value={formatDate(card.trained_at, { hour: '2-digit', minute: '2-digit' })} />
              <Row label="Data source" value={card.data_source} />
              {card.class_balance && (
                <Row
                  label="Positive rate"
                  value={formatPercent(card.class_balance.positive_rate, 2)}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluation metrics</CardTitle>
              <CardDescription>Held-out test set</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Metric label="PR-AUC" value={test.pr_auc} />
              <Metric label="ROC-AUC" value={test.roc_auc} />
              <Metric label="Precision" value={test.precision} />
              <Metric label="Recall" value={test.recall} />
              <Metric label="F1" value={test.f1} />
              {test.confusion_matrix && (
                <div className="col-span-2 rounded-lg border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
                  Confusion — TP {test.confusion_matrix.tp}, FP {test.confusion_matrix.fp}, FN{' '}
                  {test.confusion_matrix.fn}, TN {test.confusion_matrix.tn}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-deep" /> Limitations & honesty
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {(card.limitations || []).map((l, i) => (
            <p key={i} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-deep" />
              {l}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-foreground ${mono ? 'font-mono text-xs' : ''} truncate`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-bold text-foreground">
        {value == null ? '—' : Number(value).toFixed(3)}
      </p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="space-y-3 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6" style={{ width: `${90 - i * 7}%` }} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
