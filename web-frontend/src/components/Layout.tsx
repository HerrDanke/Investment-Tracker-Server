import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface Props {
  onDataClick: () => void;
}

export default function Layout({ onDataClick }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar onDataClick={onDataClick} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Mobile header - visible only on small screens */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <Menu size={22} />
        </button>
        <span className="ml-3 font-semibold">投资追踪</span>
      </div>

      <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 overflow-auto md:ml-64">
        <Outlet />
      </main>
    </div>
  );
}
