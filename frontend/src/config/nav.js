import {
  LayoutDashboard,
  Upload,
  Table2,
  Brain,
  ClipboardCheck,
  Route,
  ShieldCheck,
  FileBarChart,
  Settings,
} from 'lucide-react'

/** Primary application navigation (sidebar). */
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Investigate',
    items: [
      { to: '/analyze', label: 'Analyze Data', icon: Upload },
      { to: '/transactions', label: 'Transactions', icon: Table2 },
      { to: '/review', label: 'Review Queue', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Understand',
    items: [
      { to: '/explainability', label: 'Explainable AI', icon: Brain },
      { to: '/traceability', label: 'Traceability', icon: Route },
      { to: '/audit', label: 'Blockchain Audit', icon: ShieldCheck },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/reports', label: 'Reports', icon: FileBarChart },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]
