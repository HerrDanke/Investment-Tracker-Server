import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Filter, X } from 'lucide-react';
import { assetApi, tagApi } from '../lib/api';
import { getTypeLabel } from '../lib/utils';
import { useLang } from '../context/LanguageContext';
import { translateTagName } from '../lib/translations';
import type { AssetWithTags, Tag } from '../types';
import AssetForm from '../components/AssetForm';

export default function Assets() {
  const { t, lang } = useLang();
  const [assets, setAssets] = useState<AssetWithTags[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetWithTags | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => { loadAssets(); loadTags(); }, []);

  async function loadAssets() {
    try {
      setLoading(true);
      const data = await assetApi.list();
      setAssets(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTags() {
    try {
      const data = await tagApi.list();
      setAllTags(data);
    } catch (e: any) {
      console.error('load tags failed:', e.message);
    }
  }

  // 根据选中的标签筛选资产
  const filteredAssets = useMemo(() => {
    if (selectedTagIds.length === 0) return assets;
    return assets.filter(asset =>
      selectedTagIds.every(tagId => asset.tags.some(tag => tag.id === tagId))
    );
  }, [assets, selectedTagIds]);

  function toggleTagFilter(tagId: number) {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }

  function clearFilter() {
    setSelectedTagIds([]);
  }

  async function handleDelete(id: number) {
    if (!confirm(t('common.confirm'))) return;
    try {
      await assetApi.delete(id);
      loadAssets();
    } catch (e: any) {
      alert(t('common.failed') + ': ' + e.message);
    }
  }

  function openEdit(asset: AssetWithTags) {
    setEditingAsset(asset);
    setShowForm(true);
  }

  function openCreate() {
    setEditingAsset(undefined);
    setShowForm(true);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return <div className="text-red-500">{t('common.failed')}: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('assets.title')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTagIds.length > 0
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}>
            <Filter size={16} />
            {lang === 'en' ? 'Filter' : '筛选'}
            {selectedTagIds.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">{selectedTagIds.length}</span>}
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90">
            <Plus size={18} /> {t('assets.add')}
          </button>
        </div>
      </div>

      {/* Tag filter panel */}
      {showFilter && allTags.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{lang === 'en' ? 'Filter by tag' : '按标签筛选'}</span>
            {selectedTagIds.length > 0 && (
              <button onClick={clearFilter}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X size={14} /> {lang === 'en' ? 'Clear' : '清除筛选'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => {
              const isActive = selectedTagIds.includes(tag.id);
              return (
                <button key={tag.id}
                  onClick={() => toggleTagFilter(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                  style={isActive ? { backgroundColor: tag.color } : {}}>
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter result hint */}
      {selectedTagIds.length > 0 && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {lang === 'en' ? `Showing ${filteredAssets.length} / ${assets.length} assets` : `显示 ${filteredAssets.length} / ${assets.length} 个资产`}
          {selectedTagIds.length > 0 && (
            <span className="ml-2">
              ({lang === 'en' ? 'Tags: ' : '已选标签：'}{selectedTagIds.map(id => allTags.find(t => t.id === id)?.name).filter(Boolean).join(' + ')})
            </span>
          )}
        </div>
      )}

      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          {selectedTagIds.length > 0
            ? (lang === 'en' ? 'No assets match the filter' : '没有符合筛选条件的资产')
            : (lang === 'en' ? 'No assets, click above to add' : '暂无资产，点击上方按钮添加')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{asset.name}</h3>
                  {asset.symbol && <span className="text-sm text-zinc-400">{asset.symbol}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(asset)} className="p-1 hover:bg-zinc-100 rounded">
                    <Edit2 size={16} className="text-zinc-400" />
                  </button>
                  <button onClick={() => handleDelete(asset.id)} className="p-1 hover:bg-zinc-100 rounded">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 text-sm text-zinc-500 mb-3">
                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">{getTypeLabel(asset.asset_type, lang)}</span>
                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">{asset.currency}</span>
              </div>
              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.map(tag => (
                    <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs text-white"
                      style={{ backgroundColor: tag.color }}>
                      {tag.category === 'system' ? translateTagName(tag.name, lang as 'zh' | 'en') : tag.name}
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
          setShowForm(false);
          loadAssets();
        }} lang={lang} />
      )}
    </div>
  );
}
