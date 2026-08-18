import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { transactionApi, assetApi } from '../lib/api';
import { fmt, getTxnLabel, TXN_TYPES } from '../lib/utils';
import { useLang } from '../context/LanguageContext';
import type { TransactionWithAsset, Asset } from '../types';
import TransactionForm from '../components/TransactionForm';

const DEFAULT_WIDTHS: Record<string, number> = {
  date: 100, asset: 180, type: 80, price: 100, quantity: 100, fee: 80, amount: 120, notes: 200, actions: 90,
};

const COL_KEYS = ['date', 'asset', 'type', 'price', 'quantity', 'fee', 'amount', 'notes', 'actions'];

function loadColWidths(): Record<string, number> {
  try {
    const stored = localStorage.getItem('txn-col-widths');
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveColWidths(widths: Record<string, number>) {
  localStorage.setItem('txn-col-widths', JSON.stringify(widths));
}

export default function Transactions() {
  const { t, lang } = useLang();
  const [transactions, setTransactions] = useState<TransactionWithAsset[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState<TransactionWithAsset | undefined>();
  const [filterAsset, setFilterAsset] = useState<number | ''>('');
  const [filterType, setFilterType] = useState<string>('');
  const [colWidths, setColWidths] = useState<Record<string, number>>(loadColWidths());
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const widthsRef = useRef(colWidths);
  const resizingRef = useRef<{ col: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => { widthsRef.current = colWidths; }, [colWidths]);

  const getColWidth = (col: string) => colWidths[col] || DEFAULT_WIDTHS[col];

  useEffect(() => { loadAssets(); }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, page_size: pageSize };
      if (filterAsset) params.asset_id = filterAsset;
      if (filterType) params.txn_type = filterType;
      const result = await transactionApi.list(params);
      setTransactions(result.data);
      setTotalCount(result.total);
      setTotalPages(result.total_pages);
      // Sync in case backend clamped the page
      if (result.page !== page) setPage(result.page);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterAsset, filterType, page, pageSize]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  // Reset to first page when filters change
  useEffect(() => { setPage(1); }, [filterAsset, filterType, pageSize]);

  const loadAssets = useCallback(async () => {
    try {
      const data = await assetApi.list();
      setAssets(data);
    } catch (e: any) {
      console.error('加载资产失败:', e.message);
    }
  }, []);

  async function handleDelete(id: number) {
    if (!confirm(t('transactions.delete_confirm'))) return;
    try {
      await transactionApi.delete(id);
      loadTransactions();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
  }

  const handleResizeStart = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { col, startX: e.clientX, startWidth: getColWidth(col) };
    setResizingCol(col);
  };

  // 列宽拖拽事件监听，带清理
  useEffect(() => {
    if (!resizingCol) return;

    const handleMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const { col, startX, startWidth } = resizingRef.current;
      const diff = ev.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColWidths(prev => ({ ...prev, [col]: newWidth }));
    };

    const handleUp = () => {
      saveColWidths(widthsRef.current);
      resizingRef.current = null;
      setResizingCol(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [resizingCol]);

  const totalWidth = COL_KEYS.reduce((sum, col) => sum + getColWidth(col), 0);

  if (loading && transactions.length === 0) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return <div className="text-red-500">加载失败: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('transactions.title')}</h1>
        <button onClick={() => { setEditingTxn(undefined); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={18} /> {t('transactions.add')}
        </button>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-zinc-400" />
          <select value={filterAsset} onChange={e => setFilterAsset(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm">
            <option value="">{t('transactions.all_assets')}</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm">
            <option value="">{t('transactions.all_types')}</option>
            {TXN_TYPES.map(t => <option key={t} value={t}>{getTxnLabel(t, lang)}</option>)}
          </select>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm">
            <option value={10}>{t('transactions.page_size_10')}</option>
            <option value={20}>{t('transactions.page_size_20')}</option>
            <option value={30}>{t('transactions.page_size_30')}</option>
            <option value={40}>{t('transactions.page_size_40')}</option>
            <option value={50}>{t('transactions.page_size_50')}</option>
          </select>
        </div>
      </div>

      {/* Pagination info */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>{t('transactions.total_count').replace('{count}', String(totalCount))}</span>
        <span>{t('transactions.page_info').replace('{page}', String(page)).replace('{total}', String(totalPages))}</span>
      </div>

      {/* Desktop table - visible on md+ */}
      <div className="hidden md:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm table-fixed" style={{ minWidth: totalWidth + 'px' }}>
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <ResizableTh col="date" label={t('transactions.col_date')} width={getColWidth('date')} resizing={resizingCol === 'date'} onResize={handleResizeStart} />
              <ResizableTh col="asset" label={t('transactions.col_asset')} width={getColWidth('asset')} resizing={resizingCol === 'asset'} onResize={handleResizeStart} />
              <ResizableTh col="type" label={t('transactions.col_type')} width={getColWidth('type')} resizing={resizingCol === 'type'} onResize={handleResizeStart} />
              <ResizableTh col="price" label={t('transactions.col_price')} width={getColWidth('price')} align="right" resizing={resizingCol === 'price'} onResize={handleResizeStart} />
              <ResizableTh col="quantity" label={t('transactions.col_quantity')} width={getColWidth('quantity')} align="right" resizing={resizingCol === 'quantity'} onResize={handleResizeStart} />
              <ResizableTh col="fee" label={t('transactions.col_fee')} width={getColWidth('fee')} align="right" resizing={resizingCol === 'fee'} onResize={handleResizeStart} />
              <ResizableTh col="amount" label={t('transactions.col_amount')} width={getColWidth('amount')} align="right" resizing={resizingCol === 'amount'} onResize={handleResizeStart} />
              <ResizableTh col="notes" label={t('transactions.col_notes')} width={getColWidth('notes')} resizing={resizingCol === 'notes'} onResize={handleResizeStart} />
              <Th col="actions" label={t('transactions.col_actions')} width={getColWidth('actions')} align="center" />
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-zinc-400">{t('transactions.empty')}</td></tr>
            )}
            {transactions.map(txn => {
              const amount = txn.txn_type === 'DIVIDEND' ? 0 : (txn.price || 0) * (txn.quantity || 0) + (txn.fee || 0) + (txn.tax || 0);
              return (
                <tr key={txn.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="py-3 px-4 truncate" style={{ width: getColWidth('date') + 'px' }}>{txn.date}</td>
                  <td className="py-3 px-4 font-medium truncate" style={{ width: getColWidth('asset') + 'px' }}>{txn.asset?.name || '#' + txn.asset_id}</td>
                  <td className="py-3 px-4" style={{ width: getColWidth('type') + 'px' }}>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${txn.txn_type === 'BUY' ? 'bg-green-100 text-green-700' : txn.txn_type === 'DIVIDEND' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {getTxnLabel(txn.txn_type, lang)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right truncate" style={{ width: getColWidth('price') + 'px' }}>{txn.price?.toFixed(2) ?? '-'}</td>
                  <td className="py-3 px-4 text-right truncate" style={{ width: getColWidth('quantity') + 'px' }}>{txn.quantity}</td>
                  <td className="py-3 px-4 text-right truncate" style={{ width: getColWidth('fee') + 'px' }}>{txn.fee?.toFixed(2) ?? '-'}</td>
                  <td className="py-3 px-4 text-right truncate" style={{ width: getColWidth('amount') + 'px' }}>{txn.txn_type === 'DIVIDEND' ? '-' : fmt(amount, lang)}</td>
                  <td className="py-3 px-4 text-zinc-400 truncate" style={{ width: getColWidth('notes') + 'px' }}>{txn.notes || '-'}</td>
                  <td className="py-3 px-4 text-center sticky right-0 bg-white dark:bg-zinc-900" style={{ width: getColWidth('actions') + 'px' }}>
                    <button onClick={() => { setEditingTxn(txn); setShowForm(true) }} className="p-1 hover:bg-zinc-100 rounded mr-1">
                      <Edit2 size={14} className="text-zinc-400" />
                    </button>
                    <button onClick={() => handleDelete(txn.id)} className="p-1 hover:bg-red-50 rounded">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout - visible below md */}
      <div className="md:hidden space-y-3">
        {transactions.length === 0 && (
          <div className="text-center py-12 text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">{t('transactions.empty')}</div>
        )}
        {transactions.map(txn => {
          const amount = txn.txn_type === 'DIVIDEND' ? 0 : (txn.price || 0) * (txn.quantity || 0) + (txn.fee || 0) + (txn.tax || 0);
          return (
            <div key={txn.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{txn.asset?.name || t('transactions.no_asset')}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${txn.txn_type === 'BUY' ? 'bg-green-100 text-green-700' : txn.txn_type === 'DIVIDEND' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {getTxnLabel(txn.txn_type, lang)}
                </span>
              </div>
              <div className="text-sm text-zinc-500">{txn.date}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-zinc-400">{t('transactions.col_price')}:</span> {txn.price?.toFixed(2) ?? '-'}</div>
                <div><span className="text-zinc-400">{t('transactions.col_quantity')}:</span> {txn.quantity}</div>
                <div><span className="text-zinc-400">{t('transactions.col_fee')}:</span> {txn.fee?.toFixed(2) ?? '-'}</div>
                <div><span className="text-zinc-400">{t('transactions.col_amount')}:</span> {txn.txn_type === 'DIVIDEND' ? '-' : fmt(amount, lang)}</div>
              </div>
              {txn.notes && <div className="text-sm text-zinc-400 truncate">{txn.notes}</div>}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button onClick={() => { setEditingTxn(txn); setShowForm(true) }} className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <Edit2 size={14} className="text-zinc-400" /> {t('common.edit')}
                </button>
                <button onClick={() => handleDelete(txn.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  <Trash2 size={14} className="text-red-400" /> {t('common.delete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            {t('transactions.prev')}
          </button>
          <span className="text-sm text-zinc-500 tabular-nums">
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            {t('transactions.next')}
          </button>
        </div>
      )}

      {showForm && (
        <TransactionForm transaction={editingTxn} onClose={() => setShowForm(false)} onSave={() => {
          setShowForm(false);
          loadTransactions();
        }} lang={lang} />
      )}
    </div>
  );
}

function ResizableTh({ col, label, width, align, resizing, onResize }: {
  col: string; label: string; width: number; align?: string; resizing: boolean;
  onResize: (e: React.MouseEvent, col: string) => void;
}) {
  return (
    <th
      className="relative py-3 px-4 font-medium text-zinc-500 select-none"
      style={{ width: width + 'px', minWidth: '50px' }}
    >
      <span className={`flex items-center ${align === 'right' ? 'justify-end' : ''} ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="truncate">{label}</span>
      </span>
      {/* 列宽调整手柄 - 位于列右侧边缘 */}
      <span
        className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center gap-px z-10 ${resizing ? 'bg-blue-500/10' : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'}`}
        onMouseDown={(e) => onResize(e, col)}
      >
        <span className={`w-px h-5 transition-colors duration-150 ${resizing ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-500'}`} />
        <span className={`w-px h-5 transition-colors duration-150 ${resizing ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-500'}`} />
      </span>
    </th>
  );
}

function Th({ col, label, width, align }: {
  col: string; label: string; width: number; align?: string;
}) {
  return (
    <th
      className="relative py-3 px-4 font-medium text-zinc-500 select-none sticky right-0 bg-zinc-50 dark:bg-zinc-800/50 z-20"
      style={{ width: width + 'px', minWidth: width + 'px' }}
    >
      <span className={`flex items-center ${align === 'right' ? 'justify-end' : ''} ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="truncate">{label}</span>
      </span>
    </th>
  );
}
