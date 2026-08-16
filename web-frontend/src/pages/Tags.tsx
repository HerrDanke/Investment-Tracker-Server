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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
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
