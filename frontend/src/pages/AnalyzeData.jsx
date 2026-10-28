import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  XCircle,
  Info,
  ScanSearch,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner, ErrorState } from '@/components/ui/states'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { api, ApiError } from '@/services/api'
import { cn, formatCompact } from '@/lib/utils'

const STEPS = ['Upload', 'Preview', 'Validate', 'Results']

export default function AnalyzeData() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { dataset, validation, preview }
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')

  function pick(f) {
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
    setAnalysis(null)
    setAnalysisError('')
  }

  async function runAnalysis() {
    if (!result?.dataset?.id) return
    setAnalyzing(true)
    setAnalysisError('')
    try {
      const job = await api.createAnalysis(result.dataset.id)
      setAnalysis(job)
    } catch (err) {
      setAnalysisError(
        err instanceof ApiError ? err.message : 'Analysis failed. Please try again.',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  async function runUpload() {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const res = await api.uploadDataset(file)
      setResult(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError('')
    setAnalysis(null)
    setAnalysisError('')
  }

  const activeStep = analysis ? 3 : result ? 2 : file ? 1 : 0

  return (
    <div>
      <PageHeader
        title="Analyze Data"
        description="Upload supply-chain order data, validate it, and prepare it for fraud-risk analysis."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-2">
              <a href={api.sampleTemplateUrl}>
                <Download className="size-4" /> Template
              </a>
            </Button>
            <Button asChild variant="ghost" className="gap-2">
              <a href={api.sampleExampleUrl}>Example dataset</a>
            </Button>
          </div>
        }
      />

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto scroll-amber pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium',
                i <= activeStep
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
        <div className="space-y-6 lg:col-span-2">
          {/* Dropzone */}
          <Card>
            <CardContent className="p-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  pick(e.dataTransfer.files?.[0])
                }}
                className={cn(
                  'flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors',
                  dragging ? 'border-amber bg-amber-surface/50' : 'border-border bg-muted/30',
                )}
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-surface text-amber-deep">
                  <UploadCloud className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {file ? 'File ready' : 'Drag & drop your dataset'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  CSV or Excel (.xlsx). Max 50 MB. Your original file is never overwritten.
                </p>
                <label className="mt-4">
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt,.xlsx,.xls"
                    className="sr-only"
                    onChange={(e) => pick(e.target.files?.[0])}
                  />
                  <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber px-4 py-2 text-sm font-semibold text-white hover:bg-amber-deep">
                    <FileSpreadsheet className="size-4" /> Choose file
                  </span>
                </label>

                {file && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
                    <FileSpreadsheet className="size-4 text-amber-deep" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <Button onClick={runUpload} disabled={!file || busy} className="gap-2">
                  {busy ? (
                    <>
                      <Spinner /> Validating…
                    </>
                  ) : (
                    'Upload & validate'
                  )}
                </Button>
                {(file || result) && (
                  <Button variant="ghost" onClick={reset} disabled={busy}>
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <ErrorState
              title="Upload failed"
              description={error}
              action={
                <Button variant="outline" size="sm" onClick={runUpload}>
                  Try again
                </Button>
              }
            />
          )}

          {result && <ValidationResult result={result} />}

          {result?.validation?.is_valid && (
            <AnalyzeStep
              analyzing={analyzing}
              analysis={analysis}
              error={analysisError}
              onRun={runAnalysis}
              onView={() =>
                analysis && navigate(`/transactions?analysis=${analysis.id}`)
              }
            />
          )}
        </div>

        {/* Side info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Required columns</CardTitle>
              <CardDescription>Minimum fields to analyze an order file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {['Order ID', 'Order value'].map((c) => (
                <div key={c} className="flex items-center gap-2 text-foreground">
                  <ListChecks className="size-4 text-amber-deep" /> {c}
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">
                Recommended: product, category, region, shipping mode, quantity, dates, and{' '}
                <span className="font-medium">Order Status</span> (needed to train/evaluate — it
                carries the suspected-fraud label).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How we handle your data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> Invalid rows are
                reported, never silently dropped.
              </p>
              <p className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> Column-name
                differences get mapping suggestions.
              </p>
              <p className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> Files are
                size-limited and parsed defensively.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ValidationResult({ result }) {
  const { validation: v, preview } = result
  const columns = preview.length ? Object.keys(preview[0]) : v.columns

  return (
    <div className="space-y-6">
      {/* Verdict banner */}
      <Card
        className={cn(
          'border-l-4',
          v.is_valid ? 'border-l-success' : 'border-l-critical',
        )}
      >
        <CardContent className="flex items-start gap-3 p-5">
          {v.is_valid ? (
            <CheckCircle2 className="mt-0.5 size-5 text-success" />
          ) : (
            <XCircle className="mt-0.5 size-5 text-critical" />
          )}
          <div>
            <p className="font-semibold text-foreground">
              {v.is_valid ? 'Validation passed' : 'Validation found blocking issues'}
            </p>
            <p className="text-sm text-muted-foreground">
              {v.row_count.toLocaleString()} rows · {v.column_count} columns ·{' '}
              {v.duplicate_rows} duplicate row(s)
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant={v.is_valid ? 'success' : 'critical'}>
              {v.is_valid ? 'Ready' : 'Needs fixes'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Blocking issues */}
      {v.required_missing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-critical">
              <XCircle className="size-4" /> Missing required columns
            </CardTitle>
            <CardDescription>
              Map an existing column to these, or add them to your file, then re-upload.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {v.required_missing.map((m) => (
              <Badge key={m} variant="critical">
                {m}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggested mapping */}
      {Object.keys(v.suggested_mapping).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-4 text-amber-deep" /> Suggested column mapping
            </CardTitle>
            <CardDescription>
              These source columns look close to a known field. Confirm mappings before analysis
              (mapping UI arrives with the analysis run in Phase 3).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {Object.entries(v.suggested_mapping).map(([src, canon]) => (
              <div key={src} className="flex items-center gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">{src}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium text-amber-brown">{canon}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings & issues */}
      {(v.warnings.length > 0 || v.issues.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-deep" /> Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {v.issues.map((iss, i) => (
              <p key={`iss-${i}`} className="flex gap-2 text-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-deep" />
                {iss.detail || `${iss.column}: ${iss.issue}`}
              </p>
            ))}
            {v.warnings.map((w, i) => (
              <p key={`w-${i}`} className="flex gap-2 text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                {w}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data preview</CardTitle>
          <CardDescription>First {preview.length} rows</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c} className="whitespace-nowrap">
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((row, ri) => (
                <TableRow key={ri}>
                  {columns.map((c) => (
                    <TableCell key={c} className="whitespace-nowrap text-muted-foreground">
                      {row[c] == null ? <span className="text-border">—</span> : String(row[c])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}

const BAND_META = [
  { key: 'low', label: 'Low', color: '#059669' },
  { key: 'medium', label: 'Medium', color: '#F59E0B' },
  { key: 'high', label: 'High', color: '#D97706' },
  { key: 'critical', label: 'Critical', color: '#DC2626' },
]

function AnalyzeStep({ analyzing, analysis, error, onRun, onView }) {
  if (analysis) {
    const s = analysis.summary || {}
    const bands = s.band_counts || {}
    return (
      <Card className="border-l-4 border-l-success">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" /> Analysis complete
          </CardTitle>
          <CardDescription>
            Scored {formatCompact(s.rows_scored)} of {formatCompact(s.total_rows)} rows
            {s.truncated && ` (capped at ${formatCompact(s.max_rows)})`}
            {s.is_synthetic && ' · model trained on synthetic data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BAND_META.map((b) => (
              <div key={b.key} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm" style={{ background: b.color }} />
                  <span className="text-xs text-muted-foreground">{b.label}</span>
                </div>
                <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                  {formatCompact(bands[b.key] || 0)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={onView} className="gap-2">
              View {formatCompact(s.flagged || 0)} flagged transactions <ArrowRight className="size-4" />
            </Button>
            {s.model_version && (
              <Badge variant="outline" className="font-mono text-[11px]">{s.model_version}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanSearch className="size-5 text-amber-deep" /> Run fraud analysis
        </CardTitle>
        <CardDescription>
          Score every order with the trained model and generate risk bands + explanations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-xl border border-critical/20 bg-critical/5 px-3 py-2 text-sm text-critical">
            {error}
          </div>
        )}
        <Button onClick={onRun} disabled={analyzing} className="gap-2">
          {analyzing ? (
            <>
              <Spinner /> Scoring…
            </>
          ) : (
            <>
              <ScanSearch className="size-4" /> Run analysis
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
