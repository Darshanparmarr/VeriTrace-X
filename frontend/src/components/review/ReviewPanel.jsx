import { useEffect, useState } from 'react'
import { CheckCircle2, ShieldX, ArrowUpRight, Clock, UserCircle2, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { api, ApiError } from '@/services/api'
import { formatDate } from '@/lib/utils'

// Confirming fraud is an explicit human action requiring a reason — never automatic.
const DECISIONS = [
  { key: 'legitimate', label: 'Legitimate', variant: 'success', icon: CheckCircle2, requiresReason: false },
  { key: 'escalated', label: 'Escalate', variant: 'warning', icon: ArrowUpRight, requiresReason: true },
  { key: 'confirmed_fraud', label: 'Confirm fraud', variant: 'danger', icon: ShieldX, requiresReason: true },
]

const STATUS_LABEL = {
  new: 'New',
  under_review: 'Under review',
  legitimate: 'Legitimate / no issue',
  escalated: 'Escalated',
  confirmed_fraud: 'Confirmed fraud',
}

/** Human review controls wired to the backend. History is preserved server-side. */
export function ReviewPanel({ transactionId, onStatusChange }) {
  const [caseData, setCaseData] = useState(null)
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    api
      .getReviews(transactionId)
      .then((d) => active && setCaseData(d))
      .catch(() => active && setCaseData({ status: 'new', decisions: [] }))
    return () => {
      active = false
    }
  }, [transactionId])

  function choose(decision) {
    setError('')
    if (decision.requiresReason) setPending(decision)
    else record(decision)
  }

  async function record(decision) {
    if (decision.requiresReason && !notes.trim()) {
      setError('A reason is required for this decision.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await api.createReview(transactionId, {
        decision: decision.key,
        reason: notes.trim() || undefined,
      })
      setCaseData(updated)
      setNotes('')
      setPending(null)
      onStatusChange?.(updated.status)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not record decision.')
    } finally {
      setSaving(false)
    }
  }

  const status = caseData?.status ?? 'new'
  const history = caseData?.decisions ?? []

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Human review</CardTitle>
        <Badge variant="default">{STATUS_LABEL[status]}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {DECISIONS.map((d) => (
            <Button key={d.key} variant={d.variant} className="justify-start" disabled={saving} onClick={() => choose(d)}>
              <d.icon className="size-4" /> {d.label}
            </Button>
          ))}
        </div>

        <div>
          <Label htmlFor="review-notes">
            Notes {pending?.requiresReason && <span className="text-critical">· required</span>}
          </Label>
          <Textarea
            id="review-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context, evidence references, or your reasoning…"
            className="mt-1.5"
          />
          {error && <p className="mt-1 text-xs text-critical">{error}</p>}
          {pending && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant={pending.variant} disabled={saving} onClick={() => record(pending)}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null} Confirm: {pending.label}
              </Button>
              <Button size="sm" variant="ghost" disabled={saving} onClick={() => { setPending(null); setError('') }}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          You can disagree with the model. A prediction is a signal, not a verdict — confirming fraud
          is always a human decision, and your review history is preserved.
        </div>

        {history.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Review history
            </p>
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex gap-2 text-sm">
                  <UserCircle2 className="mt-0.5 size-4 shrink-0 text-amber-deep" />
                  <div>
                    <p className="text-foreground">
                      <span className="font-medium">{h.actor_name || 'Someone'}</span> —{' '}
                      {h.decision.replace(/_/g, ' ')}
                    </p>
                    {h.reason && <p className="text-xs text-muted-foreground">“{h.reason}”</p>}
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {formatDate(h.created_at, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
