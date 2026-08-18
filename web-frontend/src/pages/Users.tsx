import { useState, useEffect, useCallback } from 'react';
import { Trash2, Download, Shield, Users as UsersIcon } from 'lucide-react';
import { adminApi } from '../lib/api';

interface UserInfo {
  id: string;
  username: string;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.response?.data?.error || '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleDelete(user: UserInfo) {
    if (!confirm(`确定删除用户 "${user.username}"？此操作将删除该用户的所有数据，且不可恢复。`)) return;
    try {
      setActionId(user.id);
      await adminApi.deleteUser(user.id);
      loadUsers();
    } catch (e: any) {
      alert(e.response?.data?.error || '删除失败');
    } finally {
      setActionId(null);
    }
  }

  async function handleExport(user: UserInfo) {
    try {
      setActionId(user.id);
      const data = await adminApi.getUserData(user.id);
      const json = typeof data === 'string' ? JSON.stringify(JSON.parse(data), null, 2) : JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${user.username}-data.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('导出失败: ' + (e.response?.data?.error || e.message));
    } finally {
      setActionId(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return <div className="text-red-500">加载失败: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-blue-600" size={24} />
        <h1 className="text-2xl font-bold">用户管理</h1>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">暂无用户</div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">用户名</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">注册时间</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <UsersIcon size={16} className="text-zinc-400" />
                    <span className="font-medium">{u.username}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleExport(u)}
                        disabled={actionId === u.id}
                        title="导出数据"
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded disabled:opacity-50"
                      >
                        <Download size={15} className="text-zinc-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={actionId === u.id}
                        title="删除用户"
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                      >
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
