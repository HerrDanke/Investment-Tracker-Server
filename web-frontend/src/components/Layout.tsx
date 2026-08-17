import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

interface Props {
  onDataClick: () => void;
}

export default function Layout({ onDataClick }: Props) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar onDataClick={onDataClick} />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
