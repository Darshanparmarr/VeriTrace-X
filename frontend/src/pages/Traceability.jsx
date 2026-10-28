import { Factory, Truck, Warehouse, Store, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/states'
import { PhaseNotice } from '@/components/PhaseNotice'

const MILESTONES = [
  { icon: Factory, label: 'Origin — Supplier', place: 'Northwind Traders, Shenzhen', when: 'Day 0' },
  { icon: Truck, label: 'In transit', place: 'Ocean freight', when: 'Day 2–18' },
  { icon: Warehouse, label: 'Customs & warehouse', place: 'Los Angeles DC', when: 'Day 20' },
  { icon: Store, label: 'Delivered', place: 'Los Angeles, US', when: 'Day 23' },
]

export default function Traceability() {
  return (
    <div>
      <PageHeader
        title="Supply Chain Traceability"
        description="Trace an order from origin to delivery with its milestones and related audit events."
        actions={<StatusPill tone="demo" />}
      />

      <div className="mb-6">
        <PhaseNotice phase="5">
          Full traceability — origin, supplier, shipment milestones, location history, related
          transactions and audit events (and a map where coordinates genuinely exist) — is wired in
          Phase 5. Positions and events are never invented when the data lacks them.
        </PhaseNotice>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shipment journey · VX-1024</CardTitle>
          <CardDescription>Illustrative milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative ml-3 border-l border-border">
            {MILESTONES.map((m, i) => (
              <li key={i} className="mb-7 ml-6 last:mb-0">
                <span className="absolute -left-3 flex size-6 items-center justify-center rounded-full bg-amber-surface ring-4 ring-background">
                  <m.icon className="size-3.5 text-amber-deep" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{m.label}</p>
                  <span className="text-xs text-muted-foreground">· {m.when}</span>
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {m.place}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
