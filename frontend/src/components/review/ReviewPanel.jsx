import { useState } from 'react'
import { CheckCircle2, ShieldX, ArrowUpRight, Clock, UserCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Decisions a reviewer can record. A model prediction NEVER auto-confirms fraud —
// confirming fraud is an explicit human action requiring a reason.
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

/**
 * Human review controls. In Phase 1 decisions are held in local state and
 * clearly marked as not yet persisted — the real workflow (role checks,
 * preserved history, audit anchoring) lands in Phase 4/5.
 */
export function ReviewPanel({ transactionId }) {
  const [status, setStatus] = useState('new')
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  function choose(decision) {
    setError('')
    if (decision.requiresReason) {
      setPending(decision)
    } else {
      record(decision)
    }
  }

  function record(decision) {
    if (decision.requiresReason && !notes.trim()) {
      setError('A reason is required for this decision.')
      return
    }
    setStatus(decision.key)
    setHistory((h) => [
      { actor: 'You (Analyst)', action: decision.label, reason: notes.trim(), when: 'just now' },
      ...h,
    ])
    setNotes('')
    setPending(null)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Human review</CardTitle>
        <Badge variant="default">{STATUS_LABEL[status]}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {DECISIONS.map((d) => (
            <Button
              key={d.key}
              variant={d.variant}
              className="justify-start"
              onClick={() => choose(d)}
            >
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
              <Button size="sm" variant={pending.variant} onClick={() => record(pending)}>
                Confirm: {pending.label}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setPending(null); setError('') }}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          You can disagree with the model. A prediction is a signal, not a verdict — confirming fraud
          is always a human decision. Decisions here are not yet persisted (Phase 4).
        </div>

        {history.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Review history
            </p>
            <ul className="space-y-2">
              {history.map((h, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <UserCircle2 className="mt-0.5 size-4 shrink-0 text-amber-deep" />
                  <div>
                    <p className="text-foreground">
                      <span className="font-medium">{h.actor}</span> — {h.action}
                    </p>
                    {h.reason && <p className="text-xs text-muted-foreground">“{h.reason}”</p>}
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {h.when}
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
