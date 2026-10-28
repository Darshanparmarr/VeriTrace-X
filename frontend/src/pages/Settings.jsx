import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RISK_THRESHOLDS } from '@/lib/utils'
import { PhaseNotice } from '@/components/PhaseNotice'

export default function Settings() {
  const [thresholds, setThresholds] = useState(RISK_THRESHOLDS)

  return (
    <div>
      <PageHeader title="Settings" description="Profile, permissions, thresholds, and model configuration." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="thresholds">Risk thresholds</TabsTrigger>
          <TabsTrigger value="model">Model</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>User profile</CardTitle>
              <CardDescription>Display settings for your account</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-md gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Analyst" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Reviewer" disabled className="mt-1.5" />
              </div>
              <PhaseNotice phase="2">
                Authentication, roles & permissions, and persistence land with the backend in Phase 2.
              </PhaseNotice>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds">
          <Card>
            <CardHeader>
              <CardTitle>Risk band thresholds</CardTitle>
              <CardDescription>
                Boundaries (0–1) for Low / Medium / High / Critical. Documented defaults shown; these
                become server-persisted and apply to scoring in Phase 4.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-md gap-4">
              {['low', 'medium', 'high'].map((k) => (
                <div key={k}>
                  <Label htmlFor={k} className="capitalize">{k} ≥</Label>
                  <Input
                    id={k}
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={thresholds[k]}
                    onChange={(e) => setThresholds((t) => ({ ...t, [k]: Number(e.target.value) }))}
                    className="mt-1.5"
                  />
                </div>
              ))}
              <Button className="w-fit" disabled>Save (Phase 4)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle>Model configuration</CardTitle>
              <CardDescription>Active model version and data settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Active model" value="Not trained (Phase 3)" />
              <Row label="Artifact path" value="ml/artifacts/model.joblib" />
              <Row label="Dataset" value="DataCo Smart Supply Chain" />
              <PhaseNotice phase="3">
                Model training, versioning, and evaluation are implemented in Phase 3.
              </PhaseNotice>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
