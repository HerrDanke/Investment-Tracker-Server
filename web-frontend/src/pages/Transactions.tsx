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

  if (loading && transactions.length === 0) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
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
