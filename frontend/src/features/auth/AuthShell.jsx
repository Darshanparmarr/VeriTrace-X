import { Link } from 'react-router-dom'
import { ShieldCheck, Brain, Link2 } from 'lucide-react'
import { Logo } from '@/components/Logo'

/** Split-screen shell for the login/register pages. */
export function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel */}
      <div className="bg-amber-grid relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-amber-surface/30 p-10 lg:flex">
        <div className="pointer-events-none absolute -right-20 top-10 size-80 rounded-full bg-amber/10 blur-3xl" />
        <Link to="/">
          <Logo />
        </Link>
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-foreground">
            Trust every transaction. Explain every risk.
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Sign in to analyze supply-chain data, investigate flagged orders, and verify audit
            records.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              [ShieldCheck, 'ML fraud-risk scoring'],
              [Brain, 'Explainable AI (SHAP/LIME)'],
              [Link2, 'Tamper-evident audit trail'],
            ].map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-3 text-sm text-foreground">
                <span className="flex size-9 items-center justify-center rounded-xl bg-card text-amber-deep shadow-card">
                  <Icon className="size-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">Research prototype · demo mode</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
