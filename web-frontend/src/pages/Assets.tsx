import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { assetApi } from '../lib/api';
import { TYPE_LABELS } from '../lib/utils';
import type { AssetWithTags } from '../types';
import AssetForm from '../components/AssetForm';

export default function Assets() {
  const [assets, setAssets] = useState<AssetWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetWithTags | undefined>();

  useEffect(() => { loadAssets() }, []);

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

  async function handleDelete(id: number) {
    if (!confirm('确定删除该资产及其所有交易记录？')) return;
    try {
      await assetApi.delete(id);
      loadAssets();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
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
  if (error) return <div className="text-red-500">加载失败: {error}</div>;

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
        <div className="text-center py-12 text-zinc-400">暂无资产，点击上方按钮添加</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(asset => (
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
                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">{TYPE_LABELS[asset.asset_type] || asset.asset_type}</span>
                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">{asset.currency}</span>
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
          setShowForm(false);
          loadAssets();
        }} />
      )}
    </div>
  );
}
