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
