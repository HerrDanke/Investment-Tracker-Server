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
