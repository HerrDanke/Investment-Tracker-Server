import { ReactNode } from 'react';
import { X, Minimize2, Maximize2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanCardProps {
  id: string;
  title: string;
  children: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onDelete?: () => void;
  extraActions?: ReactNode;
  gridSpan?: { w: number; h: number };
}

export function KanbanCard({
  id,
  title,
  children,
  collapsed,
  onToggleCollapse,
  onDelete,
  extraActions,
  gridSpan,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: gridSpan ? `span ${gridSpan.w} / span ${gridSpan.w}` : undefined,
    gridRow: gridSpan ? `span ${gridSpan.h} / span ${gridSpan.h}` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden h-full"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <div
          className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </div>
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1 truncate">{title}</h3>
        {extraActions}
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-600">
            {collapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-zinc-400 hover:text-red-500">
            <X size={14} />
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="p-4 flex-1 overflow-auto min-h-0">
          {children}
        </div>
      )}
    </div>
  );
}
