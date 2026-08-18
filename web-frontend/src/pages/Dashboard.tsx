import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { KanbanCard } from '../components/KanbanCard';
import { StatsCard } from '../components/cards/StatsCard';
import { ChartCard } from '../components/cards/ChartCard';
import { RecentTradesCard } from '../components/cards/RecentTradesCard';
import { HoldingsCard } from '../components/cards/HoldingsCard';
import { summaryApi, transactionApi } from '../lib/api';
import { loadDashboardLayout, saveDashboardLayout } from '../lib/dashboard-layout';
import { TYPE_LABELS } from '../lib/utils';
import type {
  DashboardLayout, LayoutCard, CardType, ChartType,
  Summary, TransactionWithAsset,
} from '../types';
import { CARD_TITLES, AVAILABLE_CARDS } from '../types';

const GRID_COLUMNS = 4;

export default function Dashboard() {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithAsset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMenu]);

  const loadAllData = useCallback(() => {
    setLayout(loadDashboardLayout());
    summaryApi.get().then(setSummary).catch(e => setError(String(e)));
    transactionApi.list().then(setTransactions).catch(e => setError(String(e)));
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  const persistLayout = useCallback((newLayout: DashboardLayout) => {
    setLayout(newLayout);
    saveDashboardLayout(newLayout);
  }, []);

  const addCard = (type: CardType) => {
    if (!layout) return;
    const id = `${type}-${Date.now()}`;
    const newCard: LayoutCard = {
      id,
      type,
      chartType: type.startsWith('chart-') ? 'bar' : undefined,
      size: { w: type === 'stats' || type === 'holdings' ? 4 : 2, h: type === 'stats' ? 1 : 2 },
    };
    persistLayout({ cards: [...layout.cards, newCard] });
    setShowAddMenu(false);
  };

  const deleteCard = (id: string) => {
    if (!layout) return;
    persistLayout({ cards: layout.cards.filter(c => c.id !== id) });
  };

  const toggleCollapse = (id: string) => {
    if (!layout) return;
    persistLayout({
      cards: layout.cards.map(c => c.id === id ? { ...c, collapsed: !c.collapsed } : c),
    });
  };

  const changeChartType = useCallback((id: string, chartType: ChartType) => {
    setLayout(prev => {
      if (!prev) return prev;
      const newLayout = { cards: prev.cards.map(c => c.id === id ? { ...c, chartType } : c) };
      saveDashboardLayout(newLayout);
      return newLayout;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    if (!layout) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = layout.cards.findIndex(c => c.id === active.id);
    const newIndex = layout.cards.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newCards = arrayMove(layout.cards, oldIndex, newIndex);
    persistLayout({ cards: newCards });
  };

  const renderCardContent = useMemo(() => {
    if (!summary) return (_card: LayoutCard) => <div className="text-zinc-400 text-sm">加载中...</div>;

    return (card: LayoutCard) => {
      switch (card.type) {
        case 'stats':
          return <StatsCard overview={summary.overview} />;
        case 'chart-holdings': {
          const data = summary.assets.filter(a => a.holding_cost_basis > 0.01).map(a => ({ name: a.name, value: a.holding_cost_basis }));
          return <ChartCard title="持仓成本" data={data} initialChartType={card.chartType} onChartTypeChange={(t) => changeChartType(card.id, t)} />;
        }
        case 'chart-type': {
          const data = Object.entries(summary.type_distribution).filter(([, v]) => v > 0).map(([k, v]) => ({ name: TYPE_LABELS[k] || k, value: v }));
          return <ChartCard title="类型分布" data={data} initialChartType={card.chartType} onChartTypeChange={(t) => changeChartType(card.id, t)} />;
        }
        case 'chart-currency': {
          const data = Object.entries(summary.currency_distribution).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }));
          return <ChartCard title="货币分布" data={data} initialChartType={card.chartType} onChartTypeChange={(t) => changeChartType(card.id, t)} />;
        }
        case 'chart-tags': {
          const tagMap = new Map<string, number>();
          summary.assets.forEach(a => a.tags.forEach(t => tagMap.set(t.name, (tagMap.get(t.name) || 0) + a.holding_cost_basis)));
          const data = Array.from(tagMap.entries()).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
          return <ChartCard title="标签分布" data={data} initialChartType={card.chartType} onChartTypeChange={(t) => changeChartType(card.id, t)} />;
        }
        case 'recent-trades':
          return <RecentTradesCard transactions={transactions} />;
        case 'holdings':
          return <HoldingsCard assets={summary.assets} />;
        default:
          return <div className="text-zinc-400 text-sm">未知卡片类型</div>;
      }
    };
  }, [summary, transactions, changeChartType]);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">投资概览</h1>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-700 dark:text-red-400">加载失败: {error}</p>
          <button onClick={() => { setError(null); loadAllData(); }} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs">重试</button>
        </div>
      </div>
    );
  }

  if (!layout || !summary) return <div className="p-8 text-center text-zinc-400">加载中...</div>;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold flex-1">投资概览</h1>
        <div className="relative" ref={addMenuRef}>
          <button onClick={() => setShowAddMenu(!showAddMenu)} className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            <Plus size={16} /> 添加卡片
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
              {AVAILABLE_CARDS.map(ac => (
                <button
                  key={ac.type}
                  onClick={() => addCard(ac.type)}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="text-sm font-medium">{ac.label}</div>
                  <div className="text-xs text-zinc-500">{ac.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout.cards.map(c => c.id)} strategy={rectSortingStrategy}>
          <div
            className="flex-1 grid gap-4 auto-rows-min dashboard-grid"
            style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)` }}
          >
            {layout.cards.map(card => (
              <KanbanCard
                key={card.id}
                id={card.id}
                title={CARD_TITLES[card.type]}
                collapsed={card.collapsed}
                gridSpan={card.size}
                onToggleCollapse={() => toggleCollapse(card.id)}
                onDelete={() => deleteCard(card.id)}
              >
                {renderCardContent(card)}
              </KanbanCard>
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 opacity-80">
              {CARD_TITLES[layout.cards.find(c => c.id === activeId)?.type ?? 'stats']}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
