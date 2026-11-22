import { useEffect, useState } from 'react';
import {
  BarChart3,
  DollarSign,
  Users,
  Gamepad2,
  MousePointerClick,
  Eye,
  Shield,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { ludoApi } from '../lib/ludoApi';
import { ADMOB_ACTIVE_CONFIG } from '../config/admob';
import type { AdStatsSummary, User } from '../types';

interface AdminDashboardProps {
  currentUser: User;
}

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [section, setSection] = useState<'overview' | 'users'>('overview');
  const [stats, setStats] = useState<AdStatsSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes] = await Promise.all([
        ludoApi.getAdminStats(),
        ludoApi.getAdminUsers(),
      ]);
      setStats(statsRes);
      setUsers(usersRes.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleRoleChange(user: User) {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await ludoApi.updateUserRole(user.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update player role');
    }
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Compact Admin Sidebar */}
        <aside className="lg:col-span-3 rounded-2xl bg-[#0F1E36] border border-white/10 p-4 space-y-2">
          <div className="px-2 pb-3 border-b border-white/10">
            <p className="text-xs font-bold text-amber-400">Admin Console</p>
            <h1 className="text-lg font-extrabold text-white">LUDO STAR Analytics</h1>
          </div>

          <button
            type="button"
            onClick={() => setSection('overview')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-colors ${
              section === 'overview'
                ? 'bg-[#F59E0B] text-[#081222]'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview &amp; AdMob Revenue</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('users')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-colors ${
              section === 'users'
                ? 'bg-[#F59E0B] text-[#081222]'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Players &amp; Accounts</span>
          </button>

          <button
            type="button"
            onClick={loadDashboard}
            className="w-full px-3.5 py-2 rounded-xl bg-[#162947] hover:bg-[#1E355B] text-xs font-semibold text-white flex items-center justify-center gap-2 mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Live Data</span>
          </button>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/35 text-xs text-red-200">
              {error}
            </div>
          )}

          {loading || !stats ? (
            <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-10 text-center text-sm text-slate-400">
              Loading live AdMob and game telemetry...
            </div>
          ) : section === 'overview' ? (
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-5 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Est. Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    ${stats.totals.estimatedRevenueUsd.toFixed(4)}
                  </p>
                  <p className="text-[11px] text-slate-400">Authentic events only</p>
                </div>

                <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-5 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Ad Impressions</span>
                    <Eye className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {stats.totals.impressions.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {stats.totals.rewards} rewarded completions
                  </p>
                </div>

                <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-5 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Clicks &amp; CTR</span>
                    <MousePointerClick className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {stats.totals.clicks} ({stats.totals.ctrPercent}%)
                  </p>
                  <p className="text-[11px] text-slate-400">{stats.totals.errors} load errors</p>
                </div>

                <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-5 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Matches &amp; Rooms</span>
                    <Gamepad2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {stats.gameStats.totalMatches}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {stats.gameStats.activeRooms} live WS rooms · {stats.gameStats.totalUsers} players
                  </p>
                </div>
              </div>

              {/* AdMob Unit Breakdown Table */}
              <div className="rounded-2xl bg-[#0F1E36] border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white">AdMob Performance by Format</h2>
                    <p className="text-xs text-slate-400">
                      Zero synthetic traffic — tracks genuine user views, clicks, and rewarded completions.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-amber-300">
                    {ADMOB_ACTIVE_CONFIG.isTestMode ? 'Test Mode Active' : 'Production Mode'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0B172A] border-b border-white/10 text-xs font-semibold text-slate-300">
                        <th className="py-3 px-4">Ad Format</th>
                        <th className="py-3 px-4 text-right">Impressions</th>
                        <th className="py-3 px-4 text-right">Clicks</th>
                        <th className="py-3 px-4 text-right">Rewards</th>
                        <th className="py-3 px-4 text-right">Est. Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-sm">
                      {stats.byType.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                            No ad events recorded yet. Visit Home, Lobby, or Rewards to trigger genuine AdMob impressions.
                          </td>
                        </tr>
                      ) : (
                        stats.byType.map((row) => (
                          <tr key={row.adType}>
                            <td className="py-3 px-4 font-bold text-white capitalize">
                              {row.adType}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                              {row.impressions}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                              {row.clicks}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                              {row.rewards}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-300">
                              ${row.estimatedRevenueUsd.toFixed(4)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AdMob IDs & Android APK / AAB Export Guide */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Active Google AdMob Unit IDs</h3>
                  </div>
                  <div className="space-y-2 text-xs font-mono text-slate-300">
                    <p className="truncate">App ID: {ADMOB_ACTIVE_CONFIG.ids.appId}</p>
                    <p className="truncate">Banner: {ADMOB_ACTIVE_CONFIG.ids.banner}</p>
                    <p className="truncate">Interstitial: {ADMOB_ACTIVE_CONFIG.ids.interstitial}</p>
                    <p className="truncate">Rewarded: {ADMOB_ACTIVE_CONFIG.ids.rewarded}</p>
                    <p className="truncate">Native: {ADMOB_ACTIVE_CONFIG.ids.native}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Set <code className="text-amber-300">VITE_ADMOB_TEST_MODE=false</code> and your real <code className="text-amber-300">VITE_ADMOB_*</code> IDs before Play Store release.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Android APK &amp; AAB Build Steps</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Capacitor (`capacitor.config.ts`) and native `@capacitor-community/admob` hooks are configured. Run locally with Android Studio:
                  </p>
                  <pre className="p-3 rounded-xl bg-[#081222] border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew bundleRelease`}
                  </pre>
                </div>
              </div>

              {/* Recent Completed Matches */}
              <div className="rounded-2xl bg-[#0F1E36] border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h2 className="text-base font-bold text-white">Recent Completed Matches</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0B172A] border-b border-white/10 text-xs font-semibold text-slate-300">
                        <th className="py-3 px-4">Mode</th>
                        <th className="py-3 px-4">Winner</th>
                        <th className="py-3 px-4 text-right">Players</th>
                        <th className="py-3 px-4 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-xs">
                      {stats.recentMatches.map((m) => (
                        <tr key={m.id}>
                          <td className="py-3 px-4 font-mono text-slate-300">{m.mode}</td>
                          <td className="py-3 px-4 font-bold text-white capitalize">
                            {m.winnerName} ({m.winnerColor})
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                            {m.playersCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                            {m.durationSeconds}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Users Management Table */
            <div className="rounded-2xl bg-[#0F1E36] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h2 className="text-base font-bold text-white">Registered Players ({users.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0B172A] border-b border-white/10 text-xs font-semibold text-slate-300">
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4 text-right">Wins</th>
                      <th className="py-3 px-4 text-right">Coins</th>
                      <th className="py-3 px-4 text-right">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                        <td className="py-3 px-4 text-slate-300">{u.email}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                          {u.wins}/{u.matchesPlayed}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-300">
                          {u.coins.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={u.id === currentUser.id}
                            onClick={() => handleRoleChange(u)}
                            className={`px-2.5 py-1 rounded-lg font-semibold ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            } disabled:opacity-50`}
                          >
                            {u.role}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
