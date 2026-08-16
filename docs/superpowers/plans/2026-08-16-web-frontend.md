# Investment Tracker Web 前端实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为 Investment Tracker Server 开发一个响应式 Web 前端，提供投资数据的可视化概览、资产管理、交易记录和标签管理功能。

**架构：** React 单页应用（SPA），通过 REST API 与后端通信。前端使用 Vite 构建，React Router 管理路由，Axios 处理 HTTP 请求，Recharts 绘制图表，TailwindCSS 负责样式。

**技术栈：** React 18 + TypeScript + Vite + TailwindCSS + React Router + Axios + Recharts

---

## 文件结构

```
web-frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx                 # 入口
│   ├── App.tsx                  # 根组件 + 路由
│   ├── index.css               # Tailwind 指令
│   ├── types/
│   │   └── index.ts             # 数据类型定义
│   ├── lib/
│   │   └── api.ts               # Axios API 客户端
│   ├── components/
│   │   ├── Layout.tsx           # 布局（侧边栏 + 主内容）
│   │   ├── Sidebar.tsx          # 侧边栏导航
│   │   └── Modal.tsx            # 通用弹窗
│   ├── pages/
│   │   ├── Dashboard.tsx        # 概览仪表盘
│   │   ├── Assets.tsx           # 资产管理
│   │   ├── Transactions.tsx     # 交易记录
│   │   └── Tags.tsx             # 标签管理
│   └── hooks/
│       └── useApi.ts            # 通用 API hook
```

---

## 任务

### 任务 1：初始化 Vite + React + TypeScript 项目

**文件：**
- 创建：`web-frontend/package.json`
- 创建：`web-frontend/tsconfig.json`
- 创建：`web-frontend/tsconfig.node.json`
- 创建：`web-frontend/vite.config.ts`
- 创建：`web-frontend/tailwind.config.js`
- 创建：`web-frontend/postcss.config.js`
- 创建：`web-frontend/index.html`
- 创建：`web-frontend/src/main.tsx`
- 创建：`web-frontend/src/index.css`

- [ ] **步骤 1：创建项目目录和 package.json**

```json
{
  "name": "investment-tracker-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "axios": "^1.7.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **步骤 2：创建配置文件**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

`tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

`postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

`index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Investment Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **步骤 3：安装依赖并验证**

运行：`cd web-frontend && npm install`
预期：无错误，生成 node_modules

- [ ] **步骤 4：Commit**

```bash
git add web-frontend/
git commit -m "feat: 初始化 Vite + React + TypeScript 前端项目"
```

---

### 任务 2：定义数据类型和 API 客户端

**文件：**
- 创建：`web-frontend/src/types/index.ts`
- 创建：`web-frontend/src/lib/api.ts`

- [ ] **步骤 1：创建类型定义**

```ts
// types/index.ts
export interface Asset {
  id: number
  name: string
  symbol?: string
  assetType: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: number
  assetId: number
  txnType: string
  date: string
  price: number
  quantity: number
  fee: number
  tax: number
  currency: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: number
  name: string
  category: string
  color: string
}

export interface AssetWithTags extends Asset {
  tags: Tag[]
}

export interface TransactionWithAsset extends Transaction {
  asset?: Asset
}

export interface AssetSummary {
  id: number
  name: string
  symbol?: string
  assetType: string
  currency: string
  holding: number
  buyCost: number
  sellRevenue: number
  avgBuyCost: number
  holdingCostBasis: number
  realizedPnl?: number
  tags: Tag[]
}

export interface Overview {
  totalAssets: number
  totalInvestment: number
  totalRealizedPnl: number
  totalDividends: number
  totalFees: number
  totalTax: number
  costBasisOfHoldings: number
}

export interface Summary {
  overview: Overview
  typeDistribution: Record<string, number>
  currencyDistribution: Record<string, number>
  assets: AssetSummary[]
}

export interface CreateAsset {
  name: string
  symbol?: string
  assetType?: string
  currency?: string
  tagIds?: number[]
}

export interface CreateTransaction {
  assetId: number
  txnType: string
  date: string
  price: number
  quantity: number
  fee?: number
  tax?: number
  currency?: string
  notes?: string
}

export interface CreateTag {
  name: string
  category?: string
  color?: string
}
```

- [ ] **步骤 2：创建 API 客户端**

```ts
// lib/api.ts
import axios from 'axios'
import type { AssetWithTags, TransactionWithAsset, Tag, Summary, CreateAsset, CreateTransaction, CreateTag } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message
    return Promise.reject(new Error(msg))
  }
)

export const assetApi = {
  list: () => api.get<AssetWithTags[]>('/assets').then(r => r.data),
  get: (id: number) => api.get<AssetWithTags>(`/assets/${id}`).then(r => r.data),
  create: (data: CreateAsset) => api.post('/assets', data).then(r => r.data),
  update: (id: number, data: Partial<CreateAsset>) => api.patch(`/assets/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/assets/${id}`).then(r => r.data),
  addTag: (assetId: number, tagId: number) => api.post(`/assets/${assetId}/tags`, { tag_id: tagId }).then(r => r.data),
  removeTag: (assetId: number, tagId: number) => api.delete(`/assets/${assetId}/tags/${tagId}`).then(r => r.data),
}

export const transactionApi = {
  list: (params?: { assetId?: number; txnType?: string; startDate?: string; endDate?: string }) =>
    api.get<TransactionWithAsset[]>('/transactions', { params }).then(r => r.data),
  get: (id: number) => api.get<TransactionWithAsset>(`/transactions/${id}`).then(r => r.data),
  create: (data: CreateTransaction) => api.post('/transactions', data).then(r => r.data),
  update: (id: number, data: Partial<CreateTransaction>) => api.patch(`/transactions/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/transactions/${id}`).then(r => r.data),
}

export const tagApi = {
  list: () => api.get<Tag[]>('/tags').then(r => r.data),
  get: (id: number) => api.get<Tag>(`/tags/${id}`).then(r => r.data),
  create: (data: CreateTag) => api.post('/tags', data).then(r => r.data),
  update: (id: number, data: Partial<CreateTag>) => api.patch(`/tags/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/tags/${id}`).then(r => r.data),
}

export const summaryApi = {
  get: () => api.get<Summary>('/summary').then(r => r.data),
}

export const dataApi = {
  export: () => api.get('/export').then(r => r.data),
  import: (data: unknown) => api.post('/import', data).then(r => r.data),
}

export default api
```

- [ ] **步骤 3：Commit**

```bash
git add web-frontend/src/types/index.ts web-frontend/src/lib/api.ts
git commit -m "feat: 添加数据类型定义和 API 客户端"
```

---

### 任务 3：实现布局和路由

**文件：**
- 创建：`web-frontend/src/components/Layout.tsx`
- 创建：`web-frontend/src/components/Sidebar.tsx`
- 创建：`web-frontend/src/App.tsx`

- [ ] **步骤 1：创建 Sidebar 组件**

```tsx
// components/Sidebar.tsx
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
```

- [ ] **步骤 2：创建 Layout 组件**

```tsx
// components/Layout.tsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **步骤 3：创建 App 组件**

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Transactions from './pages/Transactions'
import Tags from './pages/Tags'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="tags" element={<Tags />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **步骤 4：创建临时占位页面**

创建 `src/pages/Dashboard.tsx`:
```tsx
export default function Dashboard() { return <h1 className="text-2xl font-bold">概览</h1> }
```

创建 `src/pages/Assets.tsx`:
```tsx
export default function Assets() { return <h1 className="text-2xl font-bold">资产</h1> }
```

创建 `src/pages/Transactions.tsx`:
```tsx
export default function Transactions() { return <h1 className="text-2xl font-bold">交易</h1> }
```

创建 `src/pages/Tags.tsx`:
```tsx
export default function Tags() { return <h1 className="text-2xl font-bold">标签</h1> }
```

- [ ] **步骤 5：验证运行**

运行：`cd web-frontend && npm run dev`
预期：Vite 启动，访问 http://localhost:5173 显示侧边栏导航和"概览"标题

- [ ] **步骤 6：Commit**

```bash
git add web-frontend/src/
git commit -m "feat: 实现布局、路由和侧边栏导航"
```

---

### 任务 4：实现概览仪表盘页面

**文件：**
- 修改：`web-frontend/src/pages/Dashboard.tsx`
- 创建：`web-frontend/src/components/StatCard.tsx`
- 创建：`web-frontend/src/components/ChartCard.tsx`

- [ ] **步骤 1：创建 StatCard 组件**

```tsx
// components/StatCard.tsx
import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string
  icon?: ReactNode
  trend?: { value: number; label: string }
}

export default function StatCard({ title, value, icon, trend }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <div className={`text-sm mt-1 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(2)}%
          <span className="text-gray-400 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **步骤 2：创建 ChartCard 组件**

```tsx
// components/ChartCard.tsx
import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export default function ChartCard({ title, children }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  )
}
```

- [ ] **步骤 3：实现 Dashboard 页面**

```tsx
// pages/Dashboard.tsx
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react'
import { summaryApi } from '../lib/api'
import type { Summary } from '../types'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSummary()
  }, [])

  async function loadSummary() {
    try {
      setLoading(true)
      const data = await summaryApi.get()
      setSummary(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>

  if (error) return <div className="text-red-500">加载失败: {error}</div>
  if (!summary) return null

  const { overview, typeDistribution, currencyDistribution, assets } = summary

  const barData = assets
    .filter(a => a.holdingCostBasis > 0)
    .map(a => ({ name: a.name, value: a.holdingCostBasis }))

  const pieData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }))

  const totalMarketValue = assets.reduce((sum, a) => sum + a.holdingCostBasis, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">投资概览</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="资产数量" value={overview.totalAssets.toString()} icon={<Wallet size={20} />} />
        <StatCard title="总投入" value={`€${overview.totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
        <StatCard title="总盈亏" value={`€${overview.totalRealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trend={overview.totalRealizedPnl >= 0 ? { value: 1, label: '' } : { value: -1, label: '' }} />
        <StatCard title="手续费/税" value={`€${(overview.totalFees + overview.totalTax).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<Receipt size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="持仓分布（按资产）">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `€${v.toFixed(2)}`} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-12">暂无持仓数据</p>}
        </ChartCard>

        <ChartCard title="类型分布">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `€${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-12">暂无数据</p>}
        </ChartCard>
      </div>
    </div>
  )
}
```

- [ ] **步骤 4：验证**

运行：`npm run dev`
预期：访问 / 显示统计卡片和图表

- [ ] **步骤 5：Commit**

```bash
git add web-frontend/src/pages/Dashboard.tsx web-frontend/src/components/StatCard.tsx web-frontend/src/components/ChartCard.tsx
git commit -m "feat: 实现概览仪表盘（统计卡片 + 柱状图 + 饼图）"
```

---

### 任务 5：实现资产管理页面

**文件：**
- 修改：`web-frontend/src/pages/Assets.tsx`
- 创建：`web-frontend/src/components/AssetForm.tsx`

- [ ] **步骤 1：创建 AssetForm 组件**

```tsx
// components/AssetForm.tsx
import { useState, useEffect } from 'react'
import type { AssetWithTags, Tag, CreateAsset } from '../types'
import { assetApi, tagApi } from '../lib/api'

interface Props {
  asset?: AssetWithTags
  onClose: () => void
  onSave: () => void
}

export default function AssetForm({ asset, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [assetType, setAssetType] = useState('stock')
  const [currency, setCurrency] = useState('EUR')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTags()
    if (asset) {
      setName(asset.name)
      setSymbol(asset.symbol || '')
      setAssetType(asset.assetType)
      setCurrency(asset.currency)
      setSelectedTags(asset.tags.map(t => t.id))
    }
  }, [asset])

  async function loadTags() {
    try {
      const tags = await tagApi.list()
      setAllTags(tags)
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const data: CreateAsset = { name, symbol, assetType, currency, tagIds: selectedTags }
      if (asset) {
        await assetApi.update(asset.id, data)
      } else {
        await assetApi.create(data)
      }
      onSave()
    } catch (e: any) {
      alert('保存失败: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleTag(tagId: number) {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{asset ? '编辑资产' : '新建资产'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">名称 *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">代码</label>
            <input type="text" value={symbol} onChange={e => setSymbol(e.target.value)}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">类型</label>
            <select value={assetType} onChange={e => setAssetType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2">
              <option value="stock">股票</option>
              <option value="etf">ETF</option>
              <option value="fund">基金</option>
              <option value="bond">债券</option>
              <option value="crypto">加密货币</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">货币</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full border rounded-lg px-3 py-2">
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="HKD">HKD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          {allTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">标签</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      selectedTags.includes(tag.id)
                        ? 'text-white' : 'bg-white text-gray-700'
                    }`}
                    style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}>
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **步骤 2：实现 Assets 页面**

```tsx
// pages/Assets.tsx
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { assetApi } from '../lib/api'
import type { AssetWithTags } from '../types'
import AssetForm from '../components/AssetForm'

export default function Assets() {
  const [assets, setAssets] = useState<AssetWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AssetWithTags | undefined>()

  useEffect(() => { loadAssets() }, [])

  async function loadAssets() {
    try {
      setLoading(true)
      const data = await assetApi.list()
      setAssets(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除该资产及其所有交易记录？')) return
    try {
      await assetApi.delete(id)
      loadAssets()
    } catch (e: any) {
      alert('删除失败: ' + e.message)
    }
  }

  function openEdit(asset: AssetWithTags) {
    setEditingAsset(asset)
    setShowForm(true)
  }

  function openCreate() {
    setEditingAsset(undefined)
    setShowForm(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
  if (error) return <div className="text-red-500">加载失败: {error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">资产管理</h1>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> 新增资产
        </button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无资产，点击上方按钮添加</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(asset => (
            <div key={asset.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{asset.name}</h3>
                  {asset.symbol && <span className="text-sm text-gray-400">{asset.symbol}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(asset)} className="p-1 hover:bg-gray-100 rounded">
                    <Edit2 size={16} className="text-gray-400" />
                  </button>
                  <button onClick={() => handleDelete(asset.id)} className="p-1 hover:bg-gray-100 rounded">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 text-sm text-gray-500 mb-3">
                <span className="px-2 py-0.5 bg-gray-100 rounded">{asset.assetType}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded">{asset.currency}</span>
              </div>
              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.map(tag => (
                    <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs text-white"
                      style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AssetForm asset={editingAsset} onClose={() => setShowForm(false)} onSave={() => {
          setShowForm(false)
          loadAssets()
        }} />
      )}
    </div>
  )
}
```

- [ ] **步骤 3：验证**

运行：`npm run dev`，访问 /assets
预期：显示资产卡片列表，可新增/编辑/删除

- [ ] **步骤 4：Commit**

```bash
git add web-frontend/src/pages/Assets.tsx web-frontend/src/components/AssetForm.tsx
git commit -m "feat: 实现资产管理页面（卡片列表 + 表单弹窗）"
```

---

### 任务 6：实现交易记录页面

**文件：**
- 修改：`web-frontend/src/pages/Transactions.tsx`
- 创建：`web-frontend/src/components/TransactionForm.tsx`

- [ ] **步骤 1：创建 TransactionForm 组件**

```tsx
// components/TransactionForm.tsx
import { useState, useEffect } from 'react'
import type { TransactionWithAsset, Asset, CreateTransaction } from '../types'
import { transactionApi, assetApi } from '../lib/api'

interface Props {
  transaction?: TransactionWithAsset
  onClose: () => void
  onSave: () => void
}

export default function TransactionForm({ transaction, onClose, onSave }: Props) {
  const [assetId, setAssetId] = useState(0)
  const [txnType, setTxnType] = useState('BUY')
  const [date, setDate] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [fee, setFee] = useState('0')
  const [tax, setTax] = useState('0')
  const [currency, setCurrency] = useState('EUR')
  const [notes, setNotes] = useState('')
  const [assets, setAssets] = useState<Asset[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAssets()
    if (transaction) {
      setAssetId(transaction.assetId)
      setTxnType(transaction.txnType)
      setDate(transaction.date)
      setPrice(transaction.price.toString())
      setQuantity(transaction.quantity.toString())
      setFee(transaction.fee.toString())
      setTax(transaction.tax.toString())
      setCurrency(transaction.currency)
      setNotes(transaction.notes || '')
    } else {
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [transaction])

  async function loadAssets() {
    try {
      const data = await assetApi.list()
      setAssets(data)
      if (!transaction && data.length > 0) setAssetId(data[0].id)
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!assetId || !price || !quantity) return
    setSaving(true)
    try {
      const data: CreateTransaction = {
        assetId, txnType, date, price: parseFloat(price),
        quantity: parseFloat(quantity), fee: parseFloat(fee),
        tax: parseFloat(tax), currency, notes
      }
      if (transaction) {
        await transactionApi.update(transaction.id, data)
      } else {
        await transactionApi.create(data)
      }
      onSave()
    } catch (e: any) {
      alert('保存失败: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{transaction ? '编辑交易' : '新建交易'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">资产 *</label>
            <select value={assetId} onChange={e => setAssetId(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2" required>
              <option value={0} disabled>选择资产</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">类型 *</label>
            <select value={txnType} onChange={e => setTxnType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2">
              <option value="BUY">买入</option>
              <option value="SELL">卖出</option>
              <option value="DIVIDEND">分红</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">日期 *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">价格 *</label>
              <input type="number" step="0.0001" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">数量 *</label>
              <input type="number" step="0.0001" value={quantity} onChange={e => setQuantity(e.target.value)}
                className="w-full border rounded-lg px-3 py-2" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">手续费</label>
              <input type="number" step="0.01" value={fee} onChange={e => setFee(e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">税</label>
              <input type="number" step="0.01" value={tax} onChange={e => setTax(e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">备注</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border rounded-lg px-3 py-2" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **步骤 2：实现 Transactions 页面**

```tsx
// pages/Transactions.tsx
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Filter } from 'lucide-react'
import { transactionApi, assetApi } from '../lib/api'
import type { TransactionWithAsset, Asset } from '../types'
import TransactionForm from '../components/TransactionForm'

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionWithAsset[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTxn, setEditingTxn] = useState<TransactionWithAsset | undefined>()
  const [filterAsset, setFilterAsset] = useState<number | ''>('')
  const [filterType, setFilterType] = useState<string>('')

  useEffect(() => { loadAssets() }, [])
  useEffect(() => { loadTransactions() }, [filterAsset, filterType])

  async function loadAssets() {
    try {
      const data = await assetApi.list()
      setAssets(data)
    } catch {}
  }

  async function loadTransactions() {
    try {
      setLoading(true)
      const params: any = {}
      if (filterAsset) params.assetId = filterAsset
      if (filterType) params.txnType = filterType
      const data = await transactionApi.list(params)
      setTransactions(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除该交易？')) return
    try {
      await transactionApi.delete(id)
      loadTransactions()
    } catch (e: any) {
      alert('删除失败: ' + e.message)
    }
  }

  function typeLabel(t: string) {
    if (t === 'BUY') return { text: '买入', cls: 'bg-green-100 text-green-700' }
    if (t === 'SELL') return { text: '卖出', cls: 'bg-red-100 text-red-700' }
    if (t === 'DIVIDEND') return { text: '分红', cls: 'bg-yellow-100 text-yellow-700' }
    return { text: t, cls: 'bg-gray-100 text-gray-700' }
  }

  if (loading && transactions.length === 0) return <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
  if (error) return <div className="text-red-500">加载失败: {error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">交易记录</h1>
        <button onClick={() => { setEditingTxn(undefined); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> 新增交易
        </button>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={filterAsset} onChange={e => setFilterAsset(e.target.value ? Number(e.target.value) : '')}
            className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="">全部资产</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="">全部类型</option>
            <option value="BUY">买入</option>
            <option value="SELL">卖出</option>
            <option value="DIVIDEND">分红</option>
          </select>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无交易记录</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">日期</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">资产</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">类型</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">价格</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">数量</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">手续费</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">金额</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map(txn => {
                const { text, cls } = typeLabel(txn.txnType)
                const amount = txn.price * txn.quantity
                return (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{txn.date}</td>
                    <td className="px-4 py-3 font-medium">{txn.asset?.name || '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{text}</span></td>
                    <td className="px-4 py-3 text-right">{txn.price.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right">{txn.quantity.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{txn.fee.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">{amount.toFixed(2)} {txn.currency}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { setEditingTxn(txn); setShowForm(true) }} className="p-1 hover:bg-gray-100 rounded mr-1">
                        <Edit2 size={14} className="text-gray-400" />
                      </button>
                      <button onClick={() => handleDelete(txn.id)} className="p-1 hover:bg-gray-100 rounded">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TransactionForm transaction={editingTxn} onClose={() => setShowForm(false)} onSave={() => {
          setShowForm(false)
          loadTransactions()
        }} />
      )}
    </div>
  )
}
```

- [ ] **步骤 3：验证**

运行：`npm run dev`，访问 /transactions
预期：显示交易表格，可筛选、新增、编辑、删除

- [ ] **步骤 4：Commit**

```bash
git add web-frontend/src/pages/Transactions.tsx web-frontend/src/components/TransactionForm.tsx
git commit -m "feat: 实现交易记录页面（表格 + 筛选 + 表单弹窗）"
```

---

### 任务 7：实现标签管理页面

**文件：**
- 修改：`web-frontend/src/pages/Tags.tsx`

- [ ] **步骤 1：实现 Tags 页面**

```tsx
// pages/Tags.tsx
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { tagApi } from '../lib/api'
import type { Tag, CreateTag } from '../types'

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | undefined>()
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('custom')
  const [formColor, setFormColor] = useState('#3B82F6')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTags() }, [])

  async function loadTags() {
    try {
      setLoading(true)
      const data = await tagApi.list()
      setTags(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingTag(undefined)
    setFormName('')
    setFormCategory('custom')
    setFormColor('#3B82F6')
    setShowForm(true)
  }

  function openEdit(tag: Tag) {
    setEditingTag(tag)
    setFormName(tag.name)
    setFormCategory(tag.category)
    setFormColor(tag.color)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    setSaving(true)
    try {
      const data: CreateTag = { name: formName, category: formCategory, color: formColor }
      if (editingTag) {
        await tagApi.update(editingTag.id, data)
      } else {
        await tagApi.create(data)
      }
      setShowForm(false)
      loadTags()
    } catch (e: any) {
      alert('保存失败: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除该标签？')) return
    try {
      await tagApi.delete(id)
      loadTags()
    } catch (e: any) {
      alert('删除失败: ' + e.message)
    }
  }

  const grouped = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {})

  if (loading) return <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
  if (error) return <div className="text-red-500">加载失败: {error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">标签管理</h1>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> 新增标签
        </button>
      </div>

      {Object.entries(grouped).map(([category, categoryTags]) => (
        <div key={category}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">{category}</h2>
          <div className="flex flex-wrap gap-3">
            {categoryTags.map(tag => (
              <div key={tag.id} className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white shadow-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                <span className="font-medium">{tag.name}</span>
                <button onClick={() => openEdit(tag)} className="p-0.5 hover:bg-gray-100 rounded ml-1">
                  <Edit2 size={14} className="text-gray-400" />
                </button>
                <button onClick={() => handleDelete(tag.id)} className="p-0.5 hover:bg-gray-100 rounded">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {tags.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无标签</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">{editingTag ? '编辑标签' : '新建标签'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名称 *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">分类</label>
                <input type="text" value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">颜色</label>
                <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)}
                  className="w-full h-10 border rounded-lg cursor-pointer" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **步骤 2：验证**

运行：`npm run dev`，访问 /tags
预期：显示标签分组，可新增/编辑/删除

- [ ] **步骤 3：Commit**

```bash
git add web-frontend/src/pages/Tags.tsx
git commit -m "feat: 实现标签管理页面（分组展示 + CRUD）"
```

---

### 任务 8：端到端验证和收尾

**文件：**
- 修改：`web-frontend/src/App.tsx`（如需要）

- [ ] **步骤 1：启动后端和前端**

后端：`cd .. && .\target\release\investment-tracker-server.exe`
前端：`cd web-frontend && npm run dev`

- [ ] **步骤 2：端到端测试清单**

- [ ] 访问 http://localhost:5173 显示仪表盘
- [ ] 侧边栏导航到所有页面正常
- [ ] 在资产页创建资产，仪表盘数据更新
- [ ] 在交易页创建交易，关联资产正确
- [ ] 在标签页创建标签，资产表单可选
- [ ] 筛选功能正常（交易类型、资产）
- [ ] 编辑/删除功能正常
- [ ] 图表正确渲染

- [ ] **步骤 3：构建验证**

运行：`cd web-frontend && npm run build`
预期：无 TypeScript 错误，生成 dist/

- [ ] **步骤 4：Commit**

```bash
git add -A
git commit -m "feat: Web 前端完成 - 端到端验证通过"
```
