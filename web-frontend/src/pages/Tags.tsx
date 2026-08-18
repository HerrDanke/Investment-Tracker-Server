import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { tagApi } from '../lib/api';
import { PRESET_COLORS } from '../lib/utils';
import { useLang } from '../context/LanguageContext';
import { translateTagName } from '../lib/translations';
import type { Tag, CreateTag } from '../types';

export default function Tags() {
  const { t, lang } = useLang();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | undefined>();
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('custom');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTags() }, []);

  async function loadTags() {
    try {
      setLoading(true);
      const data = await tagApi.list();
      setTags(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingTag(undefined);
    setFormName('');
    setFormCategory('custom');
    setFormColor('#3B82F6');
    setShowForm(true);
  }

  function openEdit(tag: Tag) {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormCategory(tag.category);
    setFormColor(tag.color);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const data: CreateTag = { name: formName, category: formCategory, color: formColor };
      if (editingTag) {
        await tagApi.update(editingTag.id, data);
      } else {
        await tagApi.create(data);
      }
      setShowForm(false);
      loadTags();
    } catch (e: any) {
      alert(e.response?.data?.error || t('common.failed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t('common.confirm'))) return;
    try {
      await tagApi.delete(id);
      loadTags();
    } catch (e: any) {
      alert(e.response?.data?.error || t('common.failed'));
    }
  }

  const grouped = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return <div className="text-red-500">{t('common.failed')}: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('tags.title')}</h1>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> {t('tags.add')}
        </button>
      </div>

      {Object.entries(grouped).map(([category, categoryTags]) => (
        <div key={category}>
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
            {category === 'system' ? t('common.system') : t('common.custom')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {categoryTags.map(tag => (
              <div key={tag.id} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                <span className="font-medium">{tag.category === 'system' ? translateTagName(tag.name, lang) : tag.name}</span>
                {tag.category === 'system' && (
                  <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{t('common.system')}</span>
                )}
                {tag.category !== 'system' && (
                  <>
                    <button onClick={() => openEdit(tag)} className="p-0.5 hover:bg-zinc-100 rounded ml-1" title={t('common.edit')}>
                      <Edit2 size={14} className="text-zinc-400" />
                    </button>
                    <button onClick={() => handleDelete(tag.id)} className="p-0.5 hover:bg-zinc-100 rounded" title={t('common.delete')}>
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {tags.length === 0 && (
        <div className="text-center py-12 text-zinc-400">{t('tags.empty')}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold mb-4">{editingTag ? t('common.edit') : t('common.add')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.name')} *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.category')}</label>
                <input type="text" value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.color')}</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)}
                    className="h-10 w-10 border border-zinc-300 dark:border-zinc-700 rounded cursor-pointer" />
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setFormColor(c)}
                        className="w-6 h-6 rounded-full border-2"
                        style={{ backgroundColor: c, borderColor: formColor === c ? '#000' : 'transparent' }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
