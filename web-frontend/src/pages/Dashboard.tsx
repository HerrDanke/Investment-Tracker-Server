import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Wallet, Receipt, TrendingUp, TrendingDown } from 'lucide-react'
import { summaryApi } from '../lib/api'
import type { Summary } from '../types'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadSummary() }, [])

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )

  if (error) return <div className="text-red-500 p-4">加载失败: {error}</div>
  if (!summary) return null

  const { overview, typeDistribution, assets } = summary

  const barData = assets
    .filter(a => a.holdingCostBasis > 0)
    .map(a => ({ name: a.name, value: Number(a.holdingCostBasis.toFixed(2)) }))

  const pieData = Object.entries(typeDistribution)
    .filter(([_, v]) => v > 0)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">投资概览</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="资产数量" value={overview.totalAssets.toString()} icon={<Wallet size={20} />} />
        <StatCard title="总投入" value={`€${overview.totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <StatCard title="已实现盈亏" value={`€${overview.totalRealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          valueColor={overview.totalRealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'} icon={overview.totalRealizedPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />} />
        <StatCard title="手续费/税" value={`€${(overview.totalFees + overview.totalTax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<Receipt size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="持仓分布（按资产）">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
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
                <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-12">暂无数据</p>}
        </ChartCard>
      </div>
    </div>
  )
}
