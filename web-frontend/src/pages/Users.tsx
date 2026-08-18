import { useState, useEffect, useCallback } from 'react';
import { Trash2, Download, Shield, Users as UsersIcon, KeyRound } from 'lucide-react';
import { adminApi, passwordApi } from '../lib/api';
import { useLang } from '../context/LanguageContext';

interface UserInfo {
  id: string;
  username: string;
  created_at: string;
  isAdmin: boolean;
}

export default function Users() {
  const { t } = useLang();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  // Password change state
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.response?.data?.error || t('common.failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg('');
    setPwError('');
    if (!pwOld || !pwNew || !pwConfirm) {
      setPwError(t('common.failed'));
      return;
    }
    if (pwNew.length < 6) {
      setPwError(t('password.too_short'));
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError(t('password.mismatch'));
      return;
    }
    try {
      setPwLoading(true);
      await passwordApi.changePassword({ old_password: pwOld, new_password: pwNew, new_password_confirm: pwConfirm });
      setPwMsg(t('password.success'));
      setPwOld('');
      setPwNew('');
      setPwConfirm('');
    } catch (err: any) {
      setPwError(err.response?.data?.error || t('common.failed'));
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDelete(user: UserInfo) {
    if (!confirm(t('users.delete_confirm').replace('{name}', user.username))) return;
    try {
      setActionId(user.id);
      await adminApi.deleteUser(user.id);
      loadUsers();
    } catch (e: any) {
      alert(e.response?.data?.error || t('common.failed'));
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
      alert(t('common.failed') + ': ' + (e.response?.data?.error || e.message));
    } finally {
      setActionId(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return <div className="text-red-500">{t('common.failed')}: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-blue-600" size={24} />
        <h1 className="text-2xl font-bold">{t('users.title')}</h1>
      </div>

      {/* Password change section for admin */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold">{t('password.title')}</h2>
        </div>
        <form onSubmit={handleChangePassword} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-zinc-500 mb-1">{t('common.old_password')}</label>
            <input
              type="password"
              value={pwOld}
              onChange={(e) => setPwOld(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              placeholder={t('password.old_placeholder')}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-zinc-500 mb-1">{t('common.new_password')}</label>
            <input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              placeholder={t('password.new_placeholder')}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-zinc-500 mb-1">{t('common.confirm_password')}</label>
            <input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              placeholder={t('password.confirm_placeholder')}
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {pwLoading ? t('password.changing') : t('common.save')}
          </button>
          {pwMsg && <span className="text-sm text-green-600 w-full">{pwMsg}</span>}
          {pwError && <span className="text-sm text-red-500 w-full">{pwError}</span>}
        </form>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">{t('users.empty')}</div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden table-container">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">{t('common.username')}</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">{t('common.registered')}</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <UsersIcon size={16} className="text-zinc-400" />
                    <span className="font-medium">{u.username}</span>
                    {u.isAdmin && (
                      <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{t('common.system')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleExport(u)}
                        disabled={actionId === u.id}
                        title={t('common.export')}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded disabled:opacity-50"
                      >
                        <Download size={15} className="text-zinc-400" />
                      </button>
                      {!u.isAdmin && (
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={actionId === u.id}
                          title={t('common.delete')}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                        >
                          <Trash2 size={15} className="text-red-400" />
                        </button>
                      )}
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
