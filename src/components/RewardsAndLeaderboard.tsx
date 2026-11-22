import { useEffect, useState } from 'react';
import {
  Coins,
  Gift,
  Play,
  Trophy,
  UserCheck,
  CheckCircle2,
  Edit3,
  Save,
} from 'lucide-react';
import { ludoApi } from '../lib/ludoApi';
import { ADMOB_ACTIVE_CONFIG } from '../config/admob';
import { AdMobNativeCard } from './AdSlots';
import type { AdConsentStatus, LeaderboardEntry, User } from '../types';

interface RewardsAndLeaderboardProps {
  activeSection: 'rewards' | 'leaderboard';
  user: User | null;
  consent: AdConsentStatus;
  onUserUpdated: (user: User) => void;
  onRequireAuth: () => void;
  onOpenRewardedAd: () => void;
}

const DAILY_REWARDS = [100, 150, 200, 300, 500];

export function RewardsAndLeaderboard({
  activeSection,
  user,
  consent,
  onUserUpdated,
  onRequireAuth,
  onOpenRewardedAd,
}: RewardsAndLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLb, setLoadingLb] = useState(true);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setNameInput(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    let cancelled = false;
    setLoadingLb(true);
    ludoApi
      .getLeaderboard()
      .then((res) => {
        if (!cancelled) setLeaderboard(res.leaderboard);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingLb(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.wins, user?.coins]);

  async function handleClaimDaily() {
    if (!user) {
      onRequireAuth();
      return;
    }
    setClaimingDaily(true);
    setRewardError(null);
    setRewardMessage(null);
    try {
      const res = await ludoApi.claimDailyReward();
      onUserUpdated(res.user);
      setRewardMessage(`Claimed +${res.coinsAwarded} daily streak coins!`);
    } catch (err) {
      setRewardError(err instanceof Error ? err.message : 'Unable to claim daily reward');
    } finally {
      setClaimingDaily(false);
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !nameInput.trim()) return;
    setSavingProfile(true);
    setRewardError(null);
    try {
      const res = await ludoApi.updateProfile(nameInput.trim());
      onUserUpdated(res.user);
      setEditingName(false);
      setRewardMessage('Player profile updated.');
    } catch (err) {
      setRewardError(err instanceof Error ? err.message : 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  // Compute remaining daily cooldown if already claimed today
  const canClaimDaily = (() => {
    if (!user?.lastDailyClaim) return true;
    const hours = (Date.now() - new Date(user.lastDailyClaim).getTime()) / (1000 * 60 * 60);
    return hours >= 24;
  })();

  if (activeSection === 'rewards') {
    const streakDay = (user?.dailyStreak || 0) % DAILY_REWARDS.length;

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Coins, Daily Rewards &amp; Profile
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Claim daily login streaks or watch optional AdMob Rewarded Videos to earn bonus coins.
            </p>
          </div>

          <div className="rounded-xl bg-[#0F1E36] border border-amber-400/35 px-4 py-3 flex items-center gap-3 shrink-0">
            <Coins className="w-6 h-6 text-[#F59E0B]" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Your Balance</p>
              <p className="text-xl font-extrabold text-white tabular-nums">
                {user ? user.coins.toLocaleString() : 'Sign in'}
              </p>
            </div>
          </div>
        </div>

        {rewardMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs font-medium text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{rewardMessage}</span>
          </div>
        )}

        {rewardError && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/35 text-xs font-medium text-red-200">
            {rewardError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Daily Login Streak */}
          <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Daily Check-In Streak</h2>
                  <p className="text-xs text-slate-400">
                    Current streak: {user?.dailyStreak || 0} days
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {DAILY_REWARDS.map((amount, idx) => {
                const isNext = idx === streakDay;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl p-2.5 text-center border ${
                      isNext
                        ? 'bg-[#162947] border-amber-400 text-white'
                        : 'bg-[#081222] border-white/10 text-slate-300'
                    }`}
                  >
                    <p className="text-[10px] text-slate-400 font-semibold">Day {idx + 1}</p>
                    <p className="text-sm font-extrabold tabular-nums text-amber-300 mt-0.5">
                      +{amount}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={claimingDaily || (Boolean(user) && !canClaimDaily)}
              onClick={handleClaimDaily}
              className="w-full py-3 rounded-xl bg-[#F59E0B] hover:bg-amber-400 disabled:bg-[#162947] disabled:text-slate-400 text-[#081222] text-sm font-extrabold transition-colors"
            >
              {!user
                ? 'Sign In to Claim Daily Reward'
                : claimingDaily
                  ? 'Claiming...'
                  : canClaimDaily
                    ? `Claim +${DAILY_REWARDS[streakDay]} Coins`
                    : 'Claimed Today — Return in 24h'}
            </button>
          </div>

          {/* Rewarded Video Ad */}
          <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Play className="w-5 h-5 text-emerald-400 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Watch Video for Bonus Coins</h2>
                  <p className="text-xs text-slate-400">
                    Google AdMob Rewarded Video · +{ADMOB_ACTIVE_CONFIG.rewardedCoinBonus} Coins
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Coins are awarded only after watching the full rewarded video ad. Never interrupts your active Ludo matches.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onRequireAuth();
                } else {
                  onOpenRewardedAd();
                }
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#081222] text-sm font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {user
                  ? `Watch Ad (+${ADMOB_ACTIVE_CONFIG.rewardedCoinBonus} Coins)`
                  : 'Sign In to Earn Ad Coins'}
              </span>
            </button>
          </div>
        </div>

        {/* Native Ad on Rewards Screen */}
        <AdMobNativeCard placement="rewards" consent={consent} gameplayActive={false} />

        {/* Player Profile Summary & Name Editor */}
        {user && (
          <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-14 h-14 rounded-xl object-cover border border-white/15"
              />
              <div>
                {editingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={36}
                      className="px-3 py-1.5 rounded-lg bg-[#081222] border border-amber-400 text-sm text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-[#081222] text-xs font-bold flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white">{user.name}</h3>
                    <button
                      type="button"
                      onClick={() => setEditingName(true)}
                      aria-label="Edit player name"
                      className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  {user.email} · {user.wins} Wins · {user.matchesPlayed} Matches Played
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <UserCheck className="w-4 h-4" />
              <span>Verified Player Account</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Leaderboard Section
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-[#F59E0B]" />
            <span>Global Champions Leaderboard</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Ranked by total match victories and coin balance across LUDO STAR.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0F1E36] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#0B172A] text-xs font-semibold text-slate-300">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4 text-right">Wins</th>
                <th className="py-3.5 px-4 text-right">Matches</th>
                <th className="py-3.5 px-4 text-right">Win Rate</th>
                <th className="py-3.5 px-4 text-right">Coins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-sm">
              {loadingLb ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, idx) => {
                  const winRate =
                    entry.matchesPlayed > 0
                      ? Math.round((entry.wins / entry.matchesPlayed) * 100)
                      : 0;
                  const isMe = user?.id === entry.id;
                  return (
                    <tr
                      key={entry.id}
                      className={isMe ? 'bg-amber-500/10' : 'hover:bg-white/[0.02]'}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-amber-300">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={entry.avatarUrl}
                            alt={entry.name}
                            className="w-8 h-8 rounded-lg object-cover border border-white/15 shrink-0"
                          />
                          <span className="font-bold text-white">
                            {entry.name} {isMe ? '(You)' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-400">
                        {entry.wins}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                        {entry.matchesPlayed}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                        {winRate}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-amber-300">
                        {entry.coins.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
