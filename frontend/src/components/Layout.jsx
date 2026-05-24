import { Outlet, NavLink } from 'react-router-dom'
import { BarChart2, Bell, Landmark, Home, Stethoscope, PiggyBank, Briefcase, Layers, LayoutDashboard, Scale } from 'lucide-react'
import { useAlertNotifications } from '../hooks/useAlertNotifications'
import ToastContainer from './ToastContainer'

export default function Layout() {
  const { toasts, dismiss } = useAlertNotifications()

  const nav = (to, Icon, label) => (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-accent/10 text-accent'
            : 'text-muted hover:text-slate-200 hover:bg-white/5'
        }`
      }
    >
      <Icon size={16} className="shrink-0" />
      <span>{label}</span>
    </NavLink>
  )

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-panel overflow-y-auto">

        {/* Logo / brand */}
        <div className="px-4 py-4 border-b border-border flex items-center gap-2.5 shrink-0">
          <div className="relative shrink-0">
            <Stethoscope size={18} className="text-accent" />
            <span className="absolute -bottom-0.5 -right-1.5 text-[9px] font-black text-green-400 leading-none">$</span>
          </div>
          <span className="font-semibold tracking-tight text-sm leading-tight">Financial Wellness</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-2 space-y-0.5">
          <p className="text-[10px] text-muted uppercase tracking-widest px-3 pt-2 pb-1">Overview</p>
          {nav('/',          LayoutDashboard, 'Dashboard')}

          <p className="text-[10px] text-muted uppercase tracking-widest px-3 pt-3 pb-1">Stocks</p>
          {nav('/watchlist', BarChart2,       'Watchlist')}
          {nav('/alerts',    Bell,            'Alerts')}
          {nav('/dividends', Landmark,        'Dividends')}

          <p className="text-[10px] text-muted uppercase tracking-widest px-3 pt-3 pb-1">Net Worth</p>
          {nav('/retirement', PiggyBank, 'Retirement')}
          {nav('/workstock',  Briefcase, 'Work Stock')}
          {nav('/assets',     Layers,    'Assets')}

          <p className="text-[10px] text-muted uppercase tracking-widest px-3 pt-3 pb-1">Planning</p>
          {nav('/mortgage',  Home,  'Mortgage')}
          {nav('/strategy',  Scale, 'Payoff vs. Invest')}
        </nav>

      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
