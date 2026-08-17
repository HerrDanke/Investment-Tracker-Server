import { useState, useRef } from 'react';
import { dataApi } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

// File System Access API types
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

export function DataModal({ open, onClose, onImportSuccess }: Props) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await dataApi.export();
      const json = JSON.stringify(data, null, 2);
      const fileName = `investment-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

      // Try File System Access API first (shows path picker dialog)
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              { description: 'JSON 文件', accept: { 'application/json': ['.json'] } },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(json);
          await writable.close();
          setSuccess(`导出成功: ${handle.name}`);
          return;
        } catch (e: any) {
          if (e.name === 'AbortError') {
            // User cancelled the picker
            setExporting(false);
            return;
          }
          // Fall through to download fallback
        }
      }

      // Fallback: browser download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('导出成功');
    } catch (e) {
      setError(`导出失败: ${String(e)}`);
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text); // 只解析一次
      await dataApi.import(data);
      setSuccess('导入成功');
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setError(`导入失败: ${String(err)}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const loading = exporting || importing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">数据导出 / 导入</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-zinc-500 mb-6">
          导出所有数据为 JSON 文件，或从 JSON 文件导入数据。导入将覆盖当前所有数据，请谨慎操作。
        </p>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? '导出中...' : '导出数据 (选择保存路径)'}
          </button>

          <button
            onClick={handleImportClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {importing ? '导入中...' : '导入数据 (选择文件)'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
