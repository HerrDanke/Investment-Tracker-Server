import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PiggyBank, ArrowLeftRight, Tags } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '概览' },
  { to: '/assets', icon: PiggyBank, label: '资产' },
  { to: '/transactions', icon: ArrowLeftRight, label: '交易' },
  { to: '/tags', icon: Tags, label: '标签' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <h1 className="text-xl font-bold mb-8 px-2">投资追踪</h1>
      <nav className="space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
