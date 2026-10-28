import { useState } from 'react'
import {
  ShieldCheck,
  ShieldX,
  ShieldQuestion,
  Link2Off,
  FileCheck2,
  Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusPill, EmptyState, ErrorState } from '@/components/ui/states'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { api } from '@/services/api'
import { useApi } from '@/hooks/useApi'

const EVENT_LABELS = {
  analysis_completed: 'Analysis completed',
  review_decision_recorded: 'Review decision recorded',
  case_escalated: 'Case escalated',
  audit_event_verified: 'Audit event verified',
}

export default function Audit() {
  const { data, loading, error, reload } = useApi(() => api.listAuditEvents({ page_size: 50 }), [])
  const [results, setResults] = useState({}) // id -> verification result
  const [verifying, setVerifying] = useState(null)

  async function verify(id) {
    setVerifying(id)
    try {
      const res = await api.verifyAuditEvent(id)
      setResults((r) => ({ ...r, [id]: res }))
    } catch {
      setResults((r) => ({ ...r, [id]: { status: 'error', message: 'Verification request failed.' } }))
    } finally {
      setVerifying(null)
    }
  }

  const events = data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Blockchain Audit Trail"
        description="Tamper-evident audit records for analyses and review decisions."
        actions={<StatusPill tone="unavailable">Dev mode · local hash-chain</StatusPill>}
      />

      <div className="mb-6 flex items-start gap-3 rounded-card border border-amber-soft/50 bg-amber-surface/50 px-4 py-3 text-sm text-amber-brown">
        <Link2Off className="mt-0.5 size-4 shrink-0" />
        <p>
          In development mode, each audit event is chained with a SHA-256 hash of the previous event
          — <strong>genuinely tamper-evident</strong> (altering any record breaks the chain), but this
          is a <strong>local hash-chain, not a public blockchain</strong>. On-chain anchoring to
          Hyperledger Fabric is the documented production path; until configured, on-chain
          verification honestly reports “unavailable”. We never fake a successful on-chain verification.
        </p>
      </div>

      {error && !loading && (
        <ErrorState title="Couldn't load audit events" description={error}
          action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>} />
      )}

      {!loading && !error && events.length === 0 && (
        <EmptyState icon={FileCheck2} title="No audit events yet"
          description="Audit events are recorded when you run an analysis or record a review decision." />
      )}

      <div className="space-y-3">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)}

        {events.map((e) => {
          const res = results[e.id]
          return (
            <Card key={e.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-surface text-amber-deep">
                  <FileCheck2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {EVENT_LABELS[e.event_type] || e.event_type}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.entity_type} #{e.entity_id} · {formatDate(e.created_at, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                    hash {e.chain_hash.slice(0, 16)}… · prev {(e.chain_prev_hash || 'GENESIS').slice(0, 12)}…
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {res && <VerifyBadge res={res} />}
                  <Button variant="outline" size="sm" disabled={verifying === e.id} onClick={() => verify(e.id)}>
                    {verifying === e.id ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    Verify
                  </Button>
                </div>
              </CardContent>
              {res?.message && (
                <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                  {res.message}
                  {res.block_index != null && ` (block #${res.block_index} of ${res.chain_length})`}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function VerifyBadge({ res }) {
  if (res.status === 'verified')
    return <Badge variant="success" className="gap-1"><ShieldCheck className="size-3" /> Verified</Badge>
  if (res.status === 'failed')
    return <Badge variant="critical" className="gap-1"><ShieldX className="size-3" /> Failed</Badge>
  if (res.status === 'unavailable')
    return <Badge variant="warning" className="gap-1"><ShieldQuestion className="size-3" /> Unavailable</Badge>
  return <Badge variant="outline">Error</Badge>
}
