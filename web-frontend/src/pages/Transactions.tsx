import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { transactionApi, assetApi } from '../lib/api';
import { fmt, TXN_LABELS, TXN_TYPES } from '../lib/utils';
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
  const widthsRef = useRef(colWidths);
  const resizingRef = useRef<{ col: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => { widthsRef.current = colWidths; }, [colWidths]);

  const getColWidth = (col: string) => colWidths[col] || DEFAULT_WIDTHS[col];

  useEffect(() => { loadAssets(); }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterAsset) params.asset_id = filterAsset;
      if (filterType) params.txn_type = filterType;
      const data = await transactionApi.list(params);
      data.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterAsset, filterType]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const loadAssets = useCallback(async () => {
    try {
      const data = await assetApi.list();
      setAssets(data);
    } catch (e: any) {
      console.error('加载资产失败:', e.message);
    }
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('确定删除该交易？')) return;
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
      const diff = ev.clientX - resizingRef.current.startX;
      const newWidth = Math.max(50, resizingRef.current.startWidth + diff);
      setColWidths(prev => ({ ...prev, [resizingRef.current!.col]: newWidth }));
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
        <h1 className="text-2xl font-bold">交易记录</h1>
        <button onClick={() => { setEditingTxn(undefined); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={18} /> 添加交易
        </button>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-zinc-400" />
          <select value={filterAsset} onChange={e => setFilterAsset(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm">
            <option value="">全部资产</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm">
            <option value="">全部类型</option>
            {TXN_TYPES.map(t => <option key={t} value={t}>{TXN_LABELS[t]}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm table-fixed" style={{ minWidth: totalWidth + 'px' }}>
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <ResizableTh col="date" label="日期" width={getColWidth('date')} resizing={resizingCol === 'date'} onResize={handleResizeStart} />
              <ResizableTh col="asset" label="资产" width={getColWidth('asset')} resizing={resizingCol === 'asset'} onResize={handleResizeStart} />
              <ResizableTh col="type" label="类型" width={getColWidth('type')} resizing={resizingCol === 'type'} onResize={handleResizeStart} />
              <ResizableTh col="price" label="价格" width={getColWidth('price')} align="right" resizing={resizingCol === 'price'} onResize={handleResizeStart} />
              <ResizableTh col="quantity" label="数量" width={getColWidth('quantity')} align="right" resizing={resizingCol === 'quantity'} onResize={handleResizeStart} />
              <ResizableTh col="fee" label="手续费" width={getColWidth('fee')} align="right" resizing={resizingCol === 'fee'} onResize={handleResizeStart} />
              <ResizableTh col="amount" label="金额" width={getColWidth('amount')} align="right" resizing={resizingCol === 'amount'} onResize={handleResizeStart} />
              <ResizableTh col="notes" label="备注" width={getColWidth('notes')} resizing={resizingCol === 'notes'} onResize={handleResizeStart} />
              <ResizableTh col="actions" label="操作" width={getColWidth('actions')} align="center" resizing={resizingCol === 'actions'} onResize={handleResizeStart} />
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-zinc-400">暂无交易记录</td></tr>
            )}
            {transactions.map(txn => {
              const amount = txn.txn_type === 'DIVIDEND' ? 0 : txn.price * txn.quantity + txn.fee + txn.tax;
              return (
                <tr key={txn.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="py-3 px-4 truncate" style={{ width: getColWidth('date') + 'px' }}>{txn.date}</td>
                  <td className="py-3 px-4 font-medium truncate" style={{ width: getColWidth('asset') + 'px' }}>{txn.asset?.name || '#' + txn.asset_id}</td>
                  <td className="py-3 px-4" style={{ width: getColWidth('type') + 'px' }}>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${txn.txn_type === 'BUY' ? 'bg-green-100 text-green-700' : txn.txn_type === 'DIVIDEND' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {TXN_LABELS[txn.txn_type] || txn.txn_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right truncate" style={{ width: getColWidth('price') + 'px' }}>{txn.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right truncate" style={{ width: getColWidth('quantity') + 'px' }}>{txn.quantity}</td>
                  <td className="py-3 px-4 text-right truncate" style={{ width: getColWidth('fee') + 'px' }}>{txn.fee.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right truncate" style={{ width: getColWidth('amount') + 'px' }}>{txn.txn_type === 'DIVIDEND' ? '-' : fmt(amount)}</td>
                  <td className="py-3 px-4 text-zinc-400 truncate" style={{ width: getColWidth('notes') + 'px' }}>{txn.notes || '-'}</td>
                  <td className="py-3 px-4 text-center" style={{ width: getColWidth('actions') + 'px' }}>
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

      {showForm && (
        <TransactionForm transaction={editingTxn} onClose={() => setShowForm(false)} onSave={() => {
          setShowForm(false);
          loadTransactions();
        }} />
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
      className={`relative py-3 px-4 font-medium text-zinc-500 select-none group`}
      style={{ width: width + 'px', minWidth: '50px' }}
    >
      <span className={`flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''} ${align === 'center' ? 'justify-center' : ''}`}>
        <span>{label}</span>
        <span
          className="relative flex-shrink-0 self-stretch w-3 cursor-col-resize flex items-center justify-center gap-px"
          onMouseDown={(e) => onResize(e, col)}
        >
          <span className={`w-px h-4 transition-colors duration-150 ${resizing ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-500'}`} />
          <span className={`w-px h-4 transition-colors duration-150 ${resizing ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-500'}`} />
        </span>
      </span>
    </th>
  );
}
