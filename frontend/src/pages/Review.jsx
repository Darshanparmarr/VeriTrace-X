import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/ui/risk-badge'
import { StatusPill } from '@/components/ui/states'
import { PhaseNotice } from '@/components/PhaseNotice'
import { recentTransactions } from '@/services/demoData'

const COLUMNS = [
  { key: 'new', title: 'New', filter: (t) => t.status === 'new' },
  { key: 'under_review', title: 'Under review', filter: (t) => t.status === 'under_review' },
  { key: 'escalated', title: 'Escalated', filter: (t) => t.status === 'escalated' },
  { key: 'legitimate', title: 'Resolved', filter: (t) => t.status === 'legitimate' || t.status === 'confirmed_fraud' },
]

export default function Review() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader
        title="Review Queue"
        description="A human workflow for investigating flagged transactions. The model proposes; a reviewer decides."
        actions={<StatusPill tone="demo" />}
      />

      <div className="mb-6">
        <PhaseNotice phase="4">
          The full workflow — role-based permissions, required reasons, preserved history, and who-did-what-when
          — is wired to the backend in Phase 4. The board below previews the layout with demo data.
        </PhaseNotice>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = recentTransactions.filter(col.filter)
          return (
            <Card key={col.key} className="bg-muted/30">
              <CardHeader className="flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">{col.title}</CardTitle>
                <Badge variant="outline">{items.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No items</p>
                )}
                {items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/transactions/${t.id}`)}
                    className="w-full rounded-xl border border-border bg-card p-3 text-left transition-shadow hover:shadow-card"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{t.id}</span>
                      <RiskBadge score={t.score} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{t.product}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.supplier}</p>
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
