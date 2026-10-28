import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusPill } from '@/components/ui/states'
import { PhaseNotice } from '@/components/PhaseNotice'

// Illustrative global importance (NOT trained-model output).
const GLOBAL_IMPORTANCE = [
  { feature: 'Order value', value: 0.28 },
  { feature: 'Supplier history', value: 0.19 },
  { feature: 'Shipping mode', value: 0.16 },
  { feature: 'Order type', value: 0.12 },
  { feature: 'Destination region', value: 0.1 },
  { feature: 'Discount rate', value: 0.08 },
  { feature: 'Days to ship', value: 0.07 },
]

export default function Explainability() {
  return (
    <div>
      <PageHeader
        title="Explainable AI"
        description="How the model behaves overall, and why individual orders get flagged — in plain English."
        actions={<StatusPill tone="demo" />}
      />

      <div className="mb-6">
        <PhaseNotice phase="3">
          Real global importance, SHAP summary plots, local explanations, and evaluation metrics
          (precision, recall, F1, ROC-AUC, PR-AUC, confusion matrix) populate here once the model is
          trained in Phase 3. Values below are illustrative.
        </PhaseNotice>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Global feature importance</CardTitle>
              <CardDescription>Which inputs most influence risk across all orders</CardDescription>
            </div>
            <Badge variant="outline">SHAP</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart layout="vertical" data={GLOBAL_IMPORTANCE} margin={{ left: 8, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="feature" width={130} tickLine={false} axisLine={false} fontSize={12} stroke="#64748B" />
                <Tooltip
                  formatter={(v) => [Number(v).toFixed(2), 'Mean |SHAP|']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {GLOBAL_IMPORTANCE.map((d, i) => (
                    <Cell key={d.feature} fill={i === 0 ? '#D97706' : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model card</CardTitle>
              <CardDescription>Version & training details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Algorithm" value="— (Phase 3)" />
              <Row label="Version" value="not trained" />
              <Row label="Trained at" value="—" />
              <Row label="Validation ROC-AUC" value="—" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Feature contribution shows correlation and model influence — not causal proof of fraud.</p>
              <p>The dataset's suspected-fraud label is research context; it is not confirmed fraud.</p>
              <p>Known biases and class imbalance are documented in model-evaluation.md.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
