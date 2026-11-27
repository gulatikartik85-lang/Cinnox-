import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader2, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { GLOBAL_LANGUAGES, HELP_HUBS } from '../data/helpHubs';
import { HelpHubIcon } from '../components/HelpHubIcon';
import { AdMobSlot } from '../components/AdMobSlot';
import {
  helpworldApi,
  type AccessibilityPrefs,
  type DashboardResponse,
  type UserProfile,
} from '../lib/helpworldApi';

export const AuthPage: React.FC<{
  mode: 'login' | 'signup';
  preferredLanguage: string;
  onSuccess: (user: UserProfile) => void;
  onNavigate: (path: string) => void;
}> = ({ mode, preferredLanguage, onSuccess, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState(preferredLanguage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res =
        mode === 'signup'
          ? await helpworldApi.register({
              name,
              email,
              password,
              preferredLanguage: language,
            })
          : await helpworldApi.login({ email, password });
      onSuccess(res.user);
      onNavigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-14">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {mode === 'signup' ? 'Create Free HelpWorld Account' : 'Sign In to HelpWorld AI'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Save your answers, pin favorite hubs, and keep your language &amp; accessibility settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
              >
                {GLOBAL_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} ({l.native})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] rounded-xl hw-accent-gradient text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === 'signup' ? 'Create Free Account' : 'Sign In'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="font-semibold text-sky-600 dark:text-sky-400 cursor-pointer"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              New to HelpWorld AI?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/signup')}
                className="font-semibold text-sky-600 dark:text-sky-400 cursor-pointer"
              >
                Create Free Account
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export const DashboardPage: React.FC<{
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile | null) => void;
  onNavigate: (path: string) => void;
  accessibility: AccessibilityPrefs;
  onChangeAccessibility: (next: AccessibilityPrefs) => void;
}> = ({ user, onUserUpdated, onNavigate, accessibility, onChangeAccessibility }) => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    helpworldApi
      .getDashboard()
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Personalised HelpWorld Dashboard
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You can use all 14 AI hubs freely as a guest, or sign in to save your answers, pinned
          hubs, and privacy preferences across devices.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="min-h-[44px] px-5 py-2.5 rounded-xl hw-accent-gradient text-white text-sm font-semibold cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/signup')}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            Create Free Account
          </button>
        </div>
      </main>
    );
  }

  const favHubs = HELP_HUBS.filter((h) => user.favoriteHubs.includes(h.slug));

  const handleClearHistory = async () => {
    await helpworldApi.clearHistory();
    setData({ stats: { totalAnswers: 0, hubsUsed: 0 }, usage: [], sessions: [] });
    setConfirmClear(false);
  };

  const handleLogout = async () => {
    await helpworldApi.logout();
    onUserUpdated(null);
    onNavigate('/');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {user.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.email} · {user.preferredLanguage} ·{' '}
              {user.isPlus ? 'HelpWorld Plus Active' : 'Free Plan'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('/hub/languages')}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Language &amp; Accessibility
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 dark:text-red-300 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Saved Help Answers</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.stats.totalAnswers ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Hubs Used</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.stats.hubsUsed ?? 0} / 14
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Text Accessibility Scale</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {accessibility.textScale === 'normal' ? '100%' : accessibility.textScale === 'lg' ? '115%' : '125%'}
          </p>
        </div>
      </div>

      <AdMobSlot
        variant="banner"
        pagePath="/dashboard"
        isPlusUser={user.isPlus}
        onOpenPlus={() => onNavigate('/plus')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Saved Assistance History
            </h2>
            {data && data.sessions.length > 0 && (
              <div>
                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirm Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                  >
                    Clear All History (Privacy)
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-[#0B1220] animate-pulse" />
              ))}
            </div>
          ) : !data?.sessions.length ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-10 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                No saved questions yet
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/hub/assistant')}
                className="min-h-[40px] px-4 py-2 rounded-xl hw-accent-gradient text-white text-xs font-semibold cursor-pointer"
              >
                Ask AI Personal Assistant
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.sessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        {s.hubName}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{s.language}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">
                        {new Date(s.createdAt + 'Z').toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {s.prompt}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {s.responsePreview}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate(`/hub/${s.hubSlug}`)}
                      className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      aria-label="Delete saved entry"
                      onClick={async () => {
                        await helpworldApi.deleteSession(s.id);
                        setData((prev) =>
                          prev
                            ? {
                                ...prev,
                                sessions: prev.sessions.filter((x) => x.id !== s.id),
                              }
                            : prev
                        );
                      }}
                      className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Pinned Hubs
            </h2>
            {favHubs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pin any hub from the home grid for instant access.
              </p>
            ) : (
              <div className="space-y-2">
                {favHubs.map((h) => (
                  <button
                    key={h.slug}
                    type="button"
                    onClick={() => onNavigate(`/hub/${h.slug}`)}
                    className="w-full min-h-[44px] flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                      <HelpHubIcon slug={h.slug} className="w-4 h-4 text-sky-500" />
                      {h.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Privacy &amp; Accessibility
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your questions stay private to your account. We never sell personal data.
            </p>
            <button
              type="button"
              onClick={() =>
                onChangeAccessibility({
                  ...accessibility,
                  highContrast: !accessibility.highContrast,
                })
              }
              className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              High Contrast: {accessibility.highContrast ? 'On' : 'Off'}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};
