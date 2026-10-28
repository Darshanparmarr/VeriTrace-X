import { useState } from 'react'
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, ListChecks } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PhaseNotice } from '@/components/PhaseNotice'
import { cn } from '@/lib/utils'

const STEPS = ['Upload', 'Preview', 'Validate', 'Map columns', 'Analyze', 'Results']

export default function AnalyzeData() {
  const [fileName, setFileName] = useState(null)
  const [dragging, setDragging] = useState(false)

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFileName(f.name)
  }

  return (
    <div>
      <PageHeader
        title="Analyze Data"
        description="Upload supply-chain order data, validate it, and run fraud-risk analysis."
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="size-4" /> Sample template
          </Button>
        }
      />

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto scroll-amber pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium',
                i === 0
                  ? 'border-amber-soft/60 bg-amber-surface text-amber-brown'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              <span className="font-mono">{i + 1}</span> {s}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  'flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-14 text-center transition-colors',
                  dragging ? 'border-amber bg-amber-surface/50' : 'border-border bg-muted/30',
                )}
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-surface text-amber-deep">
                  <UploadCloud className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {fileName ? 'File selected' : 'Drag & drop your dataset'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  CSV or Excel (.xlsx). Max 50 MB. We never overwrite your original file.
                </p>
                <label className="mt-4">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="sr-only"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  />
                  <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber px-4 py-2 text-sm font-semibold text-white hover:bg-amber-deep">
                    <FileSpreadsheet className="size-4" /> Choose file
                  </span>
                </label>
                {fileName && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
                    <FileSpreadsheet className="size-4 text-amber-deep" />
                    <span className="font-medium">{fileName}</span>
                    <Badge variant="outline">ready</Badge>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <PhaseNotice phase="2">
                  Client-side selection works now. Secure upload, column validation (missing values,
                  duplicates, type checks), plain-English error reporting, column mapping, background
                  processing with live progress, and a downloadable results file are implemented with
                  the backend in Phase 2. Uploads will be virus-safe, size-limited, and protected
                  against spreadsheet formula injection on export.
                </PhaseNotice>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Required columns</CardTitle>
              <CardDescription>What a valid order-line file contains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                'Order ID',
                'Supplier / customer',
                'Product / category',
                'Order value',
                'Order & ship dates',
                'Shipping mode',
                'Destination region',
              ].map((c) => (
                <div key={c} className="flex items-center gap-2 text-muted-foreground">
                  <ListChecks className="size-4 text-amber-deep" /> {c}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Good to know</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> Invalid rows are reported, never silently dropped.</p>
              <p className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> Column-name differences can be resolved with mapping.</p>
              <p className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> A sample template and example dataset are provided.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
