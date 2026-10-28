import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ShieldCheck,
  Brain,
  Link2,
  ArrowRight,
  Github,
  BookOpen,
  Upload,
  ScanSearch,
  ClipboardCheck,
  Boxes,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SupplyChainViz } from '@/components/landing/SupplyChainViz'

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Fraud Detection',
    body: 'Machine-learning risk scoring highlights suspicious supply-chain transactions so analysts focus where it matters — not on every order.',
  },
  {
    icon: Brain,
    title: 'Explainable AI',
    body: 'Every flag comes with a plain-English reason and SHAP-based feature contributions. Understand the "why", not just the score.',
  },
  {
    icon: Link2,
    title: 'Blockchain Traceability',
    body: 'Tamper-evident audit records anchor each decision. Verify integrity against the ledger — with honest "unavailable" states when the network is offline.',
  },
]

const STEPS = [
  { icon: Upload, title: 'Upload', body: 'Bring a CSV or Excel of order-line records. We validate columns and flag issues in plain English.' },
  { icon: ScanSearch, title: 'Analyze', body: 'The model scores each transaction and generates an explanation you can read.' },
  { icon: ClipboardCheck, title: 'Review', body: 'Investigate flagged orders, record a decision with notes, and escalate when needed.' },
  { icon: Boxes, title: 'Verify', body: 'Each audit event is anchored for tamper-evidence and can be verified later.' },
]

export default function Landing() {
  const root = useRef(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      gsap.from('[data-hero]', {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.12,
      })
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 28,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        })
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#research" className="hover:text-foreground">Research</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="#how">How It Works</a>
            </Button>
            <Button asChild size="sm">
              <Link to="/dashboard">
                Explore Dashboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-amber-grid relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-amber/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <Badge data-hero variant="amber" className="mb-5">
              Explainable AI · Supply-chain fraud detection
            </Badge>
            <h1
              data-hero
              className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Trust Every Transaction.
              <br />
              <span className="bg-gradient-to-r from-amber-deep to-amber bg-clip-text text-transparent">
                Explain Every Risk.
              </span>
            </h1>
            <p data-hero className="mt-5 max-w-xl text-lg text-muted-foreground">
              VeriTrace-X scores supply-chain transactions for fraud risk, explains every flag in
              plain English, and anchors each decision in a tamper-evident audit trail.
            </p>
            <div data-hero className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Explore Dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#how">How It Works</a>
              </Button>
            </div>
            <p data-hero className="mt-6 text-xs text-muted-foreground">
              Research prototype. Suspected fraud, model predictions, and confirmed fraud are kept
              distinct — scores are not claims of guilt.
            </p>
          </div>

          <div data-hero className="relative">
            <SupplyChainViz />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Complex technology. Simple experience.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three capabilities working together — so a user with no AI or blockchain background can
            find, understand, and verify risk.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              data-reveal
              className="rounded-card border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-surface text-amber-deep">
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              A four-step journey from raw order data to a verifiable decision.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} data-reveal className="relative rounded-card border border-border bg-card p-6">
                <span className="absolute right-4 top-4 font-mono text-sm font-bold text-amber/40">
                  0{i + 1}
                </span>
                <div className="flex size-11 items-center justify-center rounded-xl bg-amber text-white">
                  <s.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research + tech */}
      <section id="research" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div data-reveal>
            <Badge variant="outline" className="mb-4">Research alignment</Badge>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Built around a reproducible research framework
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              VeriTrace-X implements the concept{' '}
              <em>"An Explainable AI Framework for Blockchain-Based Fraud Detection in Supply Chain
              Traceability."</em>{' '}
              It uses the DataCo Smart Supply Chain dataset (~180,519 order-line records, ~2.25%
              suspected-fraud rate) as research context — not as a guarantee of model performance.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {[
                'Compares Logistic Regression, Random Forest and XGBoost on measured metrics',
                'Evaluates precision, recall, F1, ROC-AUC and PR-AUC with leakage checks',
                'Keeps suspected fraud, model predictions and confirmed fraud distinct',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-deep" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal className="rounded-card border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold text-foreground">Technology</h3>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <TechItem label="Frontend" value="React · Vite · Tailwind" />
              <TechItem label="Backend" value="FastAPI · Pydantic" />
              <TechItem label="ML" value="scikit-learn · XGBoost" />
              <TechItem label="Explain" value="SHAP · LIME" />
              <TechItem label="Data" value="PostgreSQL" />
              <TechItem label="Ledger" value="Hyperledger Fabric" />
            </div>
            <p className="mt-5 rounded-xl bg-amber-surface/60 px-3 py-2.5 text-xs text-amber-brown">
              Open-source first. The core fraud-detection system runs without any paid AI service.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Logo className="h-8" />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              An explainable-AI framework for blockchain-based fraud detection in supply-chain
              traceability. Research prototype.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="https://github.com" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Github className="size-4" /> GitHub
            </a>
            <Link to="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <BookOpen className="size-4" /> Documentation
            </Link>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} VeriTrace-X · Trust · Trace · Verify
        </div>
      </footer>
    </div>
  )
}

function TechItem({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  )
}
