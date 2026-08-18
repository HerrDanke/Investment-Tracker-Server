import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PiggyBank, ArrowLeftRight, Tags, Database, Moon, Sun, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '概览' },
  { to: '/assets', icon: PiggyBank, label: '资产' },
  { to: '/transactions', icon: ArrowLeftRight, label: '交易' },
  { to: '/tags', icon: Tags, label: '标签' },
  { to: '/users', icon: Shield, label: '用户管理', adminOnly: true },
];

interface Props {
  onDataClick: () => void;
}

export default function Sidebar({ onDataClick }: Props) {
  const { user, logout, isAdmin } = useAuth();
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch (_e) {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <aside className="w-64 bg-zinc-900 dark:bg-zinc-950 text-white h-screen p-4 flex flex-col fixed left-0 top-0 overflow-y-auto">
      <h1 className="text-xl font-bold mb-8 px-2">投资追踪</h1>
      <nav className="space-y-1 flex-1">
        {navItems.filter(item => !item.adminOnly || isAdmin).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-zinc-700 pt-4 space-y-1">
        <button
          onClick={onDataClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 w-full text-left transition-colors"
        >
          <Database size={20} />
          <span>数据管理</span>
        </button>
        <button
          onClick={() => setDark(!dark)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 w-full text-left transition-colors"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
          <span>{dark ? '浅色模式' : '深色模式'}</span>
        </button>
      </div>
      {/* User section at bottom */}
      {user && (
        <div className="border-t border-zinc-700 pt-4 mt-2">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.username}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-300 hover:bg-red-900/30 hover:text-red-400 w-full text-left transition-colors"
          >
            <LogOut size={20} />
            <span>退出登录</span>
          </button>
        </div>
      )}
    </aside>
  );
}
