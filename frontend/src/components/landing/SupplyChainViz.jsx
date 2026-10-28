import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Factory, Truck, Warehouse, Store, ShieldCheck } from 'lucide-react'

/**
 * Animated supply-chain journey for the landing hero.
 * A packet travels along a path through four nodes; a shield "verifies"
 * at the end. GSAP-driven, and disabled under prefers-reduced-motion.
 */
export function SupplyChainViz() {
  const scope = useRef(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      // Dash flow along the connecting path
      gsap.to('[data-flow]', {
        strokeDashoffset: -24,
        duration: 1.2,
        ease: 'none',
        repeat: -1,
      })
      // Packet traveling the path
      gsap.to('[data-packet]', {
        duration: 4,
        repeat: -1,
        ease: 'power1.inOut',
        // Animate position via keyframed attributes (AttrPlugin is in gsap core)
        keyframes: [
          { attr: { cx: 60, cy: 150 }, duration: 0 },
          { attr: { cx: 150, cy: 70 } },
          { attr: { cx: 250, cy: 150 } },
          { attr: { cx: 340, cy: 70 } },
        ],
      })
      gsap.from('[data-node]', {
        scale: 0,
        opacity: 0,
        transformOrigin: 'center',
        duration: 0.5,
        stagger: 0.12,
        ease: 'back.out(1.7)',
      })
      gsap.to('[data-pulse]', {
        scale: 1.25,
        opacity: 0,
        transformOrigin: 'center',
        duration: 1.6,
        repeat: -1,
        ease: 'power1.out',
      })
    }, scope)

    return () => ctx.revert()
  }, [])

  const nodes = [
    { x: 60, y: 150, Icon: Factory, label: 'Supplier' },
    { x: 150, y: 70, Icon: Truck, label: 'Transit' },
    { x: 250, y: 150, Icon: Warehouse, label: 'Warehouse' },
    { x: 340, y: 70, Icon: Store, label: 'Retail' },
  ]

  return (
    <div ref={scope} className="rounded-card border border-border bg-card p-4 shadow-elevated">
      <svg viewBox="0 0 400 220" className="w-full" role="img" aria-label="Animated supply-chain journey from supplier to verified retail">
        {/* connecting path */}
        <path
          d="M60 150 L150 70 L250 150 L340 70"
          fill="none"
          stroke="#E7E5E4"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          data-flow
          d="M60 150 L150 70 L250 150 L340 70"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="4 8"
        />

        {/* traveling packet */}
        <circle data-packet cx="60" cy="150" r="6" fill="#D97706" />

        {/* nodes */}
        {nodes.map((n, i) => (
          <g key={i} data-node transform={`translate(${n.x - 22}, ${n.y - 22})`}>
            <circle data-pulse cx="22" cy="22" r="22" fill="#F59E0B" opacity="0.18" />
            <rect width="44" height="44" rx="12" fill="#FFFFFF" stroke="#E7E5E4" />
            <foreignObject x="10" y="10" width="24" height="24">
              <div className="flex size-6 items-center justify-center text-amber-deep">
                <n.Icon className="size-5" />
              </div>
            </foreignObject>
          </g>
        ))}

        {/* verification shield at end */}
        <g transform="translate(340, 70)">
          <circle r="16" fill="#059669" opacity="0.12" />
        </g>
      </svg>

      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px] text-muted-foreground">
        {nodes.map((n) => (
          <span key={n.label}>{n.label}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-success/10 py-2 text-xs font-medium text-success">
        <ShieldCheck className="size-4" /> Each step anchored for tamper-evidence
      </div>
    </div>
  )
}
