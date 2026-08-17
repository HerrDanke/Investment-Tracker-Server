# Web 前端与桌面端对齐计划

> **面向 AI 代理的工作者：** 此计划将 Web 前端升级到与 Tauri 桌面端相同的 UI 和功能水平。

**目标：** 让 Web 前端在 UI、交互和功能上与桌面端保持一致，包括 Notion 风格看板、可调整列宽、数据导出/导入增强、深色模式等。

**范围：** 修改 `E:/FN_Syn/Projects/Investment Tracker Server/web-frontend/` 下的文件。

---

## 桌面端 vs Web 前端 差异分析

| 功能 | 桌面端 | Web 前端（当前） | 需要对齐 |
|------|--------|-----------------|----------|
| Dashboard | Notion 风格看板，@dnd-kit 拖拽，可添加/删除/折叠卡片 | 简单图表展示 | ✅ |
| 交易表格列宽 | 可调整，双竖线手柄，持久化到 localStorage | 固定列宽 | ✅ |
| 数据导出/导入 | 系统文件对话框（Tauri dialog） | 浏览器默认下载/文件选择 | ✅ |
| 看板布局持久化 | 保存到本地 JSON 文件 | 无 | ✅ |
| 深色模式 | 全局 dark: 类支持 | 无 | ✅ |
| 图表类型切换 | 柱状图/饼图/折线图可切换 | 固定图表类型 | ✅ |
| 卡片类型 | 7 种（stats/chart-holdings/chart-type/chart-currency/chart-tags/recent-trades/holdings） | 2 种（柱状图+饼图） | ✅ |
| 格式化 | fmt() 货币格式化 | toLocaleString | ✅ |
| 标签显示 | TYPE_LABELS 中文映射 | 原始值 | ✅ |
| 交易类型 | TXN_LABELS 中文映射 | 原始值 | ✅ |
| 刷新机制 | refreshKey 全局刷新 | 无 | ✅ |
| 图表颜色 | PIE_COLORS 8 色调色板 | 硬编码 8 色 | ✅ |

---

## 任务

### 任务 1：添加工具函数和常量

**文件：**
- 创建：`web-frontend/src/lib/utils.ts`
- 修改：`web-frontend/src/types/index.ts`（添加看板布局类型）

- [ ] **步骤 1：创建 utils.ts**

```ts
// lib/utils.ts
const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export const fmt = (v: number): string => currencyFormatter.format(v);

export const fmtK = (v: number): string => {
  if (v >= 1000) return '€' + (v / 1000).toFixed(1) + 'k';
  return '€' + v.toFixed(0);
};

export const TYPE_LABELS: Record<string, string> = {
  stock: '股票',
  fund: '基金',
  etf: 'ETF',
  bond: '债券',
  crypto: '加密货币',
  other: '其他',
};

export const TXN_LABELS: Record<string, string> = {
  BUY: '买入',
  SELL: '卖出',
  DIVIDEND: '分红',
  INTEREST: '利息',
  SPLIT: '拆分',
  OTHER: '其他',
};

export const PIE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

export const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

export const CURRENCIES = ['CNY', 'USD', 'HKD', 'EUR', 'JPY', 'GBP'];
export const ASSET_TYPES = ['stock', 'fund', 'etf', 'bond', 'crypto', 'other'];
export const TXN_TYPES = ['BUY', 'SELL', 'DIVIDEND'];

export function classList(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function dateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

- [ ] **步骤 2：添加看板布局类型到 types/index.ts**

在 `types/index.ts` 末尾添加：

```ts
// Dashboard types
export type CardType = 'stats' | 'chart-holdings' | 'chart-type' | 'chart-currency' | 'chart-tags' | 'recent-trades' | 'holdings';
export type ChartType = 'bar' | 'pie' | 'line';

export interface LayoutCard {
  id: string;
  type: CardType;
  chartType?: ChartType;
  size: { w: number; h: number };
  collapsed?: boolean;
}

export interface DashboardLayout {
  cards: LayoutCard[];
}

export const CARD_TITLES: Record<CardType, string> = {
  stats: '投资概览',
  'chart-holdings': '持仓分布',
  'chart-type': '类型分布',
  'chart-currency': '货币分布',
  'chart-tags': '标签分布',
  'recent-trades': '最近交易',
  holdings: '持仓明细',
};

export const AVAILABLE_CARDS: { type: CardType; label: string; description: string }[] = [
  { type: 'stats', label: '投资概览', description: '总投入、持仓成本、盈亏统计' },
  { type: 'chart-holdings', label: '持仓分布图', description: '按资产展示持仓成本' },
  { type: 'chart-type', label: '类型分布图', description: '按资产类型展示分布' },
  { type: 'chart-currency', label: '货币分布图', description: '按货币展示投资分布' },
  { type: 'chart-tags', label: '标签分布图', description: '按标签展示投资分布' },
  { type: 'recent-trades', label: '最近交易', description: '最近 5 笔交易记录' },
  { type: 'holdings', label: '持仓明细', description: '所有持仓资产详情' },
];
```

- [ ] **步骤 3：Commit**

```bash
git add web-frontend/src/lib/utils.ts web-frontend/src/types/index.ts
git commit -m "feat: 添加工具函数常量和看板类型定义"
```

---

### 任务 2：实现 Notion 风格看板 Dashboard

**文件：**
- 安装：@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- 创建：`web-frontend/src/components/KanbanCard.tsx`
- 创建：`web-frontend/src/components/cards/StatsCard.tsx`
- 创建：`web-frontend/src/components/cards/ChartCard.tsx`
- 创建：`web-frontend/src/components/cards/RecentTradesCard.tsx`
- 创建：`web-frontend/src/components/cards/HoldingsCard.tsx`
- 创建：`web-frontend/src/lib/dashboard-layout.ts`
- 修改：`web-frontend/src/pages/Dashboard.tsx`

- [ ] **步骤 1：安装 @dnd-kit**

```bash
cd web-frontend && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **步骤 2：创建 KanbanCard.tsx**

```tsx
// components/KanbanCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  collapsed?: boolean;
  gridSpan?: { w: number; h: number };
  onToggleCollapse?: () => void;
  onDelete?: () => void;
  children: ReactNode;
}

export function KanbanCard({ id, title, collapsed, gridSpan, onToggleCollapse, onDelete, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: gridSpan ? `span ${gridSpan.w} / span ${gridSpan.w}` : undefined,
    gridRow: gridSpan ? `span ${gridSpan.h} / span ${gridSpan.h}` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <button {...attributes} {...listeners} className="cursor-grab hover:text-zinc-600 text-zinc-400">
          <GripVertical size={16} />
        </button>
        <h3 className="text-sm font-semibold flex-1">{title}</h3>
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} className="text-zinc-400 hover:text-zinc-600">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="text-zinc-400 hover:text-red-500">
            <X size={16} />
          </button>
        )}
      </div>
      {!collapsed && <div className="p-4 flex-1 overflow-auto">{children}</div>}
    </div>
  );
}
```

- [ ] **步骤 3：创建 StatsCard.tsx**

```tsx
// components/cards/StatsCard.tsx
import { fmt } from '../../lib/utils';
import type { Overview } from '../../types';

interface Props { overview: Overview; }

export function StatsCard({ overview }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-xs text-zinc-500">总投入</div>
        <div className="text-lg font-bold">{fmt(overview.total_investment)}</div>
      </div>
      <div>
        <div className="text-xs text-zinc-500">持仓成本</div>
        <div className="text-lg font-bold">{fmt(overview.cost_basis_of_holdings)}</div>
      </div>
      <div>
        <div className="text-xs text-zinc-500">已实现盈亏</div>
        <div className={`text-lg font-bold ${overview.total_realized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {fmt(overview.total_realized_pnl)}
        </div>
      </div>
      <div>
        <div className="text-xs text-zinc-500">分红</div>
        <div className="text-lg font-bold text-blue-600">{fmt(overview.total_dividends)}</div>
      </div>
    </div>
  );
}
```

- [ ] **步骤 4：创建 ChartCard.tsx**

```tsx
// components/cards/ChartCard.tsx
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { PIE_COLORS } from '../../lib/utils';
import type { ChartType } from '../../types';

interface Props {
  title: string;
  data: { name: string; value: number }[];
  initialChartType?: ChartType;
  onChartTypeChange?: (type: ChartType) => void;
}

export function ChartCard({ title, data, initialChartType = 'bar', onChartTypeChange }: Props) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);

  const handleTypeChange = (type: ChartType) => {
    setChartType(type);
    onChartTypeChange?.(type);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 text-xs text-zinc-500">{title}</div>
        <div className="flex gap-1">
          {(['bar', 'pie', 'line'] as ChartType[]).map(t => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-2 py-0.5 text-xs rounded ${chartType === t ? 'bg-blue-100 text-blue-700' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              {t === 'bar' ? '柱状' : t === 'pie' ? '饼图' : '折线'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
            </PieChart>
          ) : (
            <LineChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **步骤 5：创建 RecentTradesCard.tsx**

```tsx
// components/cards/RecentTradesCard.tsx
import { TXN_LABELS } from '../../lib/utils';
import type { TransactionWithAsset } from '../../types';

interface Props { transactions: TransactionWithAsset[]; }

export function RecentTradesCard({ transactions }: Props) {
  const recent = transactions.slice(0, 5);
  return (
    <div className="space-y-2">
      {recent.length === 0 && <div className="text-zinc-400 text-sm">暂无交易</div>}
      {recent.map(({ transaction: t, asset }) => (
        <div key={t.id} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded text-xs ${t.txn_type === 'BUY' ? 'bg-green-100 text-green-700' : t.txn_type === 'DIVIDEND' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
              {TXN_LABELS[t.txn_type] || t.txn_type}
            </span>
            <span className="font-medium">{asset?.name || '#' + t.asset_id}</span>
          </div>
          <span className="text-zinc-500">{t.date}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **步骤 6：创建 HoldingsCard.tsx**

```tsx
// components/cards/HoldingsCard.tsx
import { fmt, TYPE_LABELS } from '../../lib/utils';
import type { AssetSummary } from '../../types';

interface Props { assets: AssetSummary[]; }

export function HoldingsCard({ assets }: Props) {
  const holdings = assets.filter(a => a.holding > 0.001);
  return (
    <div className="space-y-2 overflow-auto max-h-64">
      {holdings.length === 0 && <div className="text-zinc-400 text-sm">暂无持仓</div>}
      {holdings.map(a => (
        <div key={a.id} className="flex items-center justify-between text-sm border-b border-zinc-50 pb-2">
          <div>
            <div className="font-medium">{a.name}</div>
            <div className="text-xs text-zinc-400">{TYPE_LABELS[a.asset_type] || a.asset_type} · {a.currency}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{fmt(a.holding_cost_basis)}</div>
            <div className="text-xs text-zinc-400">{a.holding.toFixed(2)} 份</div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **步骤 7：创建 dashboard-layout.ts**

```ts
// lib/dashboard-layout.ts
import type { DashboardLayout, LayoutCard } from '../types';

const STORAGE_KEY = 'dashboard-layout';

export function loadDashboardLayout(): DashboardLayout {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  // Default layout
  return {
    cards: [
      { id: 'stats-default', type: 'stats', size: { w: 4, h: 1 } },
      { id: 'chart-holdings-default', type: 'chart-holdings', chartType: 'bar', size: { w: 2, h: 2 } },
      { id: 'chart-type-default', type: 'chart-type', chartType: 'pie', size: { w: 2, h: 2 } },
      { id: 'recent-trades-default', type: 'recent-trades', size: { w: 2, h: 2 } },
      { id: 'holdings-default', type: 'holdings', size: { w: 2, h: 2 } },
    ],
  };
}

export function saveDashboardLayout(layout: DashboardLayout): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}
```

- [ ] **步骤 8：替换 Dashboard.tsx**

完全替换为桌面端相同的 Notion 风格看板实现（使用 DndContext、SortableContext、KanbanCard 等）。

- [ ] **步骤 9：Commit**

```bash
git add web-frontend/
git commit -m "feat: Dashboard 升级为 Notion 风格看板（拖拽 + 7 种卡片类型）"
```

---

### 任务 3：交易表格列宽调整

**文件：**
- 修改：`web-frontend/src/pages/Transactions.tsx`

- [ ] **步骤 1：添加列宽状态和 ResizableTh 组件**

添加与桌面端相同的列宽调整功能：
- `DEFAULT_WIDTHS` 常量
- `loadColWidths()` / `saveColWidths()` localStorage 持久化
- `ResizableTh` 组件（双竖线手柄，hover 高亮，拖拽变蓝）
- `handleResizeStart` 鼠标事件处理

- [ ] **步骤 2：Commit**

```bash
git add web-frontend/src/pages/Transactions.tsx
git commit -m "feat: 交易表格添加列宽调整功能（持久化 + 双竖线手柄）"
```

---

### 任务 4：数据导出/导入增强

**文件：**
- 创建：`web-frontend/src/components/DataModal.tsx`
- 修改：`web-frontend/src/App.tsx`（添加全局刷新机制）

- [ ] **步骤 1：创建 DataModal 组件**

```tsx
// components/DataModal.tsx
import { useState } from 'react';
import { dataApi } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function DataModal({ open, onClose, onRefresh }: Props) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleExport() {
    setExporting(true);
    setError('');
    try {
      const data = await dataApi.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investment-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await dataApi.import(data);
      onRefresh();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">数据管理</h2>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <div className="space-y-4">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {exporting ? '导出中...' : '导出数据'}
          </button>
          <label className="block">
            <span className="sr-only">选择文件</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </label>
          {importing && <div className="text-sm text-zinc-500">导入中...</div>}
        </div>
        <button onClick={onClose} className="mt-4 w-full px-4 py-2 border rounded-lg">关闭</button>
      </div>
    </div>
  );
}
```

- [ ] **步骤 2：在 App.tsx 添加全局刷新机制**

```tsx
// App.tsx
import { useState, useCallback } from 'react';
import { DataModal } from './components/DataModal';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDataModal, setShowDataModal] = useState(false);

  const refreshAll = useCallback(() => setRefreshKey(k => k + 1), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onDataClick={() => setShowDataModal(true)} />}>
          <Route index element={<Dashboard key={refreshKey} />} />
          <Route path="assets" element={<Assets key={refreshKey} />} />
          <Route path="transactions" element={<Transactions key={refreshKey} />} />
          <Route path="tags" element={<Tags key={refreshKey} />} />
        </Route>
      </Routes>
      <DataModal open={showDataModal} onClose={() => setShowDataModal(false)} onRefresh={refreshAll} />
    </BrowserRouter>
  );
}
```

- [ ] **步骤 3：Commit**

```bash
git add web-frontend/
git commit -m "feat: 添加数据导出/导入弹窗 + 全局刷新机制"
```

---

### 任务 5：深色模式支持

**文件：**
- 修改：`web-frontend/tailwind.config.js`
- 修改：`web-frontend/src/index.css`
- 修改：`web-frontend/src/App.tsx`（添加主题切换）

- [ ] **步骤 1：配置 Tailwind 支持 class 模式深色**

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **步骤 2：添加深色模式切换按钮到 Layout**

在 Sidebar 底部添加一个切换按钮，使用 localStorage 保存偏好。

- [ ] **步骤 3：Commit**

```bash
git add web-frontend/
git commit -m "feat: 添加深色模式支持"
```

---

### 任务 6：使用 TYPE_LABELS / TXN_LABELS / fmt 替换原始值

**文件：**
- 修改：`web-frontend/src/pages/Assets.tsx`
- 修改：`web-frontend/src/pages/Transactions.tsx`
- 修改：`web-frontend/src/pages/Tags.tsx`

- [ ] **步骤 1：Assets.tsx 使用 TYPE_LABELS**

将 `asset.asset_type` 显示改为 `TYPE_LABELS[asset.asset_type] || asset.asset_type`

- [ ] **步骤 2：Transactions.tsx 使用 TXN_LABELS 和 fmt**

将 `txn.txn_type` 显示改为 `TXN_LABELS[txn.txn_type] || txn.txn_type`
将金额格式化改为 `fmt()` 函数

- [ ] **步骤 3：Commit**

```bash
git add web-frontend/src/pages/
git commit -m "feat: 使用中文标签映射和货币格式化"
```

---

### 任务 7：最终验证

- [ ] **步骤 1：TypeScript 编译**

```bash
cd web-frontend && npx tsc --noEmit
```

- [ ] **步骤 2：生产构建**

```bash
cd web-frontend && npx vite build
```

- [ ] **步骤 3：启动并手动验证**

```bash
cd web-frontend && npm run dev
```

验证清单：
- [ ] 看板页面显示可拖拽卡片
- [ ] 添加/删除卡片功能正常
- [ ] 图表类型切换（柱状/饼图/折线）
- [ ] 交易表格列宽可调整且持久化
- [ ] 数据导出/导入功能正常
- [ ] 深色模式切换正常
- [ ] 中文标签显示正确

- [ ] **步骤 4：Commit**

```bash
git add -A
git commit -m "feat: Web 前端与桌面端功能对齐完成"
```
