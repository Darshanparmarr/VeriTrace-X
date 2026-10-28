import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/ui/risk-badge'
import { ErrorState } from '@/components/ui/states'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { useApi } from '@/hooks/useApi'

const COLUMNS = [
  { key: 'new', title: 'New', statuses: ['new'] },
  { key: 'under_review', title: 'Under review', statuses: ['under_review'] },
  { key: 'escalated', title: 'Escalated', statuses: ['escalated'] },
  { key: 'resolved', title: 'Resolved', statuses: ['legitimate', 'confirmed_fraud'] },
]

async function loadBoard() {
  const statuses = ['new', 'under_review', 'escalated', 'legitimate', 'confirmed_fraud']
  const results = await Promise.all(
    statuses.map((s) => api.listTransactions({ review_status: s, page_size: 50 })),
  )
  const byStatus = Object.fromEntries(statuses.map((s, i) => [s, results[i].items]))
  return byStatus
}

export default function Review() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApi(loadBoard, [])

  return (
    <div>
      <PageHeader
        title="Review Queue"
        description="A human workflow for investigating flagged transactions. The model proposes; a reviewer decides."
      />

      {error && !loading && (
        <ErrorState title="Couldn't load the queue" description={error}
          action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>} />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = data
            ? col.statuses.flatMap((s) => data[s] || [])
            : []
          return (
            <Card key={col.key} className="bg-muted/30">
              <CardHeader className="flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">{col.title}</CardTitle>
                {!loading && <Badge variant="outline">{items.length}</Badge>}
              </CardHeader>
              <CardContent className="space-y-2">
                {loading &&
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}

                {!loading && items.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No items</p>
                )}

                {!loading &&
                  items.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/transactions/${t.id}`)}
                      className="w-full rounded-xl border border-border bg-card p-3 text-left transition-shadow hover:shadow-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{t.order_id}</span>
                        <RiskBadge score={t.risk_score} />
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{t.product || '—'}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.supplier || '—'}</p>
                    </button>
                  ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
