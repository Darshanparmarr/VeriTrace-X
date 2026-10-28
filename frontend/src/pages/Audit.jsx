import { ShieldX, Link2Off, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusPill } from '@/components/ui/states'
import { Badge } from '@/components/ui/badge'
import { PhaseNotice } from '@/components/PhaseNotice'

// Illustrative audit events. Verification state is honestly "unavailable" in dev mode.
const EVENTS = [
  { id: 'evt-5f3a', type: 'Analysis completed', target: 'Batch #12', when: 'Day 0' },
  { id: 'evt-77c1', type: 'Review decision recorded', target: 'VX-1007', when: 'Day 0' },
  { id: 'evt-9b20', type: 'Case escalated', target: 'VX-1007', when: 'Day 1' },
]

export default function Audit() {
  return (
    <div>
      <PageHeader
        title="Blockchain Audit Trail"
        description="Tamper-evident audit records for analyses and review decisions."
        actions={<StatusPill tone="unavailable">Blockchain unavailable</StatusPill>}
      />

      <div className="mb-6">
        <PhaseNotice phase="5">
          In development mode, audit events are stored off-chain and are <strong>not</strong> anchored
          to a real ledger — so verification honestly reports “unavailable”. With Hyperledger Fabric
          configured (Phase 5), each event is anchored and can be verified against the real network,
          with explicit Verified / Verification Failed / Unavailable states. We never fake a
          successful on-chain verification.
        </PhaseNotice>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verify a record</CardTitle>
          <CardDescription>Check an audit event's integrity against the ledger</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Enter event ID (e.g. evt-5f3a)" className="pl-9" />
            </div>
            <Button variant="outline" disabled>
              <Link2Off className="size-4" /> Verify (unavailable in dev mode)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent audit events</CardTitle>
          <CardDescription>Stored off-chain until Fabric is configured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {EVENTS.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ShieldX className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{e.type}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.id} · {e.target} · {e.when}
                </p>
              </div>
              <Badge variant="outline">Not anchored</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
