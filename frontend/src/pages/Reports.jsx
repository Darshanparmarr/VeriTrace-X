import { FileBarChart, Download, Printer } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/states'
import { PhaseNotice } from '@/components/PhaseNotice'

const REPORTS = [
  { title: 'Fraud-risk summary', body: 'Risk-band distribution and flagged volume over a period.' },
  { title: 'Review outcomes', body: 'Decisions recorded by reviewers, with reasons and escalations.' },
  { title: 'Model performance', body: 'Evaluation metrics for the active model version.' },
  { title: 'Transaction-level results', body: 'Per-order scores and statuses for export.' },
]

export default function Reports() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Summaries and exports for analysts and stakeholders."
        actions={<StatusPill tone="demo" />}
      />

      <div className="mb-6">
        <PhaseNotice phase="6">
          CSV export and printable reports are generated from real stored results in Phase 6. Exports
          are protected against spreadsheet formula injection.
        </PhaseNotice>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.title}>
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-surface text-amber-deep">
                <FileBarChart className="size-5" />
              </div>
              <CardTitle className="mt-3">{r.title}</CardTitle>
              <CardDescription>{r.body}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="size-4" /> CSV
              </Button>
              <Button variant="ghost" size="sm" disabled>
                <Printer className="size-4" /> Print
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
