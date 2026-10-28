import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/states'
import { useAuth } from '@/features/auth/AuthContext'
import { api, ApiError } from '@/services/api'
import { useApi } from '@/hooks/useApi'

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Profile, risk thresholds, and model configuration." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="thresholds">Risk thresholds</TabsTrigger>
          <TabsTrigger value="model">Model</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="thresholds"><ThresholdsTab /></TabsContent>
        <TabsContent value="model"><ModelTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileTab() {
  const { user } = useAuth()
  return (
    <Card>
      <CardHeader>
        <CardTitle>User profile</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-md gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={user?.full_name || ''} readOnly className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email || ''} readOnly className="mt-1.5" />
        </div>
        <div>
          <Label>Role</Label>
          <div className="mt-1.5"><Badge variant="amber" className="capitalize">{user?.role || 'analyst'}</Badge></div>
        </div>
      </CardContent>
    </Card>
  )
}

function ThresholdsTab() {
  const { data, loading } = useApi(() => api.getThresholds(), [])
  const [values, setValues] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (data) setValues(data)
  }, [data])

  async function save() {
    setSaving(true); setMsg(''); setErr('')
    try {
      const saved = await api.updateThresholds({
        low: Number(values.low),
        medium: Number(values.medium),
        high: Number(values.high),
      })
      setValues(saved)
      setMsg('Thresholds saved. New analyses will use these bands.')
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not save thresholds.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !values) {
    return <Card><CardContent className="p-6"><Spinner /></CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk band thresholds</CardTitle>
        <CardDescription>
          Boundaries (0–1) for Low / Medium / High / Critical. Must satisfy 0 &lt; low &lt; medium &lt; high &lt; 1.
          These apply to future analyses.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-md gap-4">
        {['low', 'medium', 'high'].map((k) => (
          <div key={k}>
            <Label htmlFor={k} className="capitalize">{k} ≥</Label>
            <Input id={k} type="number" step="0.05" min="0" max="1" value={values[k]}
              onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))} className="mt-1.5" />
          </div>
        ))}
        {err && <p className="text-sm text-critical">{err}</p>}
        {msg && <p className="flex items-center gap-1.5 text-sm text-success"><CheckCircle2 className="size-4" /> {msg}</p>}
        <Button className="w-fit gap-2" onClick={save} disabled={saving}>
          {saving && <Spinner />} Save thresholds
        </Button>
      </CardContent>
    </Card>
  )
}

function ModelTab() {
  const { data, loading } = useApi(() => api.modelCard(), [])
  if (loading) return <Card><CardContent className="p-6"><Spinner /></CardContent></Card>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model configuration</CardTitle>
        <CardDescription>Active model version and data source</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Row label="Status" value={data?.status === 'active' ? 'Active' : 'Not trained'} />
        <Row label="Algorithm" value={data?.algorithm || '—'} />
        <Row label="Version" value={data?.version || '—'} mono />
        <Row label="Data source" value={data?.data_source || '—'} />
        <Row label="Synthetic" value={data?.is_synthetic ? 'Yes' : 'No'} />
        <p className="pt-2 text-xs text-muted-foreground">
          Retrain with <code className="rounded bg-muted px-1">python -m veritrace_ml.train</code> in the
          ml/ directory, then restart the backend to load the new artifact.
        </p>
      </CardContent>
    </Card>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-foreground ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
