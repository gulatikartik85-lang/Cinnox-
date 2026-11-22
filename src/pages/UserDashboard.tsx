import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, LogOut, Trash2 } from 'lucide-react';
import { AI_TOOLS } from '../data/toolsCatalog';
import { ToolIcon } from '../components/ToolIcon';
import { AdSenseSlot } from '../components/AdSenseSlot';
import {
  cinnoxApi,
  type DashboardData,
  type GenerationRecord,
  type UserProfile,
} from '../lib/cinnoxApi';

interface UserDashboardProps {
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile | null) => void;
  onNavigate: (path: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  onUserUpdated,
  onNavigate,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTool, setFilterTool] = useState('all');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setLoading(true);
      cinnoxApi
        .getDashboard()
        .then((d) => {
          setData(d);
          setError('');
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Sign in to open your User Dashboard
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your saved AI generations, pinned favorite studios, and chat history appear here once
          signed in.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="px-5 py-2.5 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/signup')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-indigo-800/70 text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </main>
    );
  }

  const favoriteToolObjects = AI_TOOLS.filter((t) => user.favoriteTools.includes(t.slug));
  const filteredGenerations: GenerationRecord[] = (data?.generations || []).filter(
    (g) => filterTool === 'all' || g.toolSlug === filterTool
  );

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    try {
      const res = await cinnoxApi.updateProfile(profileName);
      onUserUpdated(res.user);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch {
      // handled silently
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await cinnoxApi.deleteGeneration(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              stats: {
                ...prev.stats,
                totalGenerations: Math.max(0, prev.stats.totalGenerations - 1),
              },
              generations: prev.generations.filter((g) => g.id !== id),
            }
          : prev
      );
    } catch {
      // ignore
    }
  };

  const handleCopy = (g: GenerationRecord) => {
    navigator.clipboard?.writeText(g.outputPreview || g.outputData);
    setCopiedId(g.id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleLogout = async () => {
    await cinnoxApi.logout();
    onUserUpdated(null);
    onNavigate('/');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-indigo-950/70">
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-indigo-800/70"
          />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {user.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.email} · Personal AI Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-indigo-900/70 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-violet-500 cursor-pointer"
          >
            Browse All 15 Tools
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Saved Generations</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.stats.totalGenerations ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Studios Used</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.stats.toolsUsedCount ?? 0} / 15
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Saved Chatbot Prompts</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.stats.chatTurns ?? 0}
          </p>
        </div>
      </div>

      <AdSenseSlot variant="banner" pagePath="/dashboard" onNavigate={onNavigate} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Saved Generations */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Recent Generations History
            </h2>

            <select
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value)}
              aria-label="Filter saved generations by tool"
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-indigo-900/70 bg-white dark:bg-[#0B0E1C] text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Studios</option>
              {AI_TOOLS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-24 rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-slate-100 dark:bg-[#0B0E1C] animate-pulse"
                />
              ))}
            </div>
          ) : filteredGenerations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-10 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                No saved generations yet
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Run any of the 15 AI tools while signed in and your outputs will automatically
                appear here.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/tools/image-generator')}
                className="px-4 py-2 rounded-lg cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
              >
                Open Image Generator
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGenerations.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-violet-600 dark:text-violet-300">
                        {g.toolName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {new Date(g.createdAt + 'Z').toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {g.prompt}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {g.outputPreview}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate(`/tools/${g.toolSlug}`)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-indigo-900/70 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-violet-500 cursor-pointer"
                    >
                      Open Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(g)}
                      aria-label="Copy output preview"
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-indigo-900/70 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-violet-500 cursor-pointer"
                    >
                      {copiedId === g.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      aria-label="Delete saved record"
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-indigo-900/70 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Favorites & Profile Settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Pinned Favorite Tools
            </h2>
            {favoriteToolObjects.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click the heart icon on any studio card on the homepage to pin it here for one-click
                launch.
              </p>
            ) : (
              <div className="space-y-2">
                {favoriteToolObjects.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => onNavigate(`/tools/${t.slug}`)}
                    className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-indigo-950/70 hover:border-violet-500 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ToolIcon
                        slug={t.slug}
                        className="w-4 h-4 text-violet-600 dark:text-violet-300 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {t.name}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSaveName}
            className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5 space-y-3"
          >
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Account Settings
            </h2>
            <div>
              <label
                htmlFor="dash-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Display Name
              </label>
              <input
                id="dash-name"
                type="text"
                minLength={2}
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={savingName}
              className="w-full py-2 rounded-xl cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
            >
              {nameSaved ? 'Profile Updated' : savingName ? 'Saving...' : 'Save Display Name'}
            </button>
          </form>

          <AdSenseSlot variant="sidebar" pagePath="/dashboard" onNavigate={onNavigate} />
        </div>
      </div>
    </main>
  );
};
