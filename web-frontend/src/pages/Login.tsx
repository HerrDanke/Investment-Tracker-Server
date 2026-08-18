import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t('common.failed'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || t('common.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">{t('app.name')}</h1>
            <p className="text-sm text-zinc-500 mt-1">{t('nav.login')}</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.username')}</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('common.username')}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('common.password')}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t('common.loading') : t('nav.login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowRegister(true)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
            >
              <UserPlus size={14} />
              {t('nav.register')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterForm({ onBack }: { onBack: () => void }) {
  const { register } = useAuth();
  const { t } = useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setError(t('common.failed'));
      return;
    }
    if (!password) {
      setError(t('common.failed'));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t('password.mismatch'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(username.trim(), password, passwordConfirm);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || t('common.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">{t('nav.register')}</h1>
            <p className="text-sm text-zinc-500 mt-1">{t('app.name')}</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.username')} *</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('assets.name_placeholder')}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.password')} *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('password.new_placeholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.confirm_password')} *</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('password.confirm_placeholder')}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t('common.loading') : t('nav.register')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              {t('nav.login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
