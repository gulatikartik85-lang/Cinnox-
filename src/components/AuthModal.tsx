import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Crown } from 'lucide-react';
import { ludoApi, setStoredToken } from '../lib/ludoApi';
import type { User } from '../types';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        tab === 'login'
          ? await ludoApi.login(email, password)
          : await ludoApi.register(name, email, password);
      setStoredToken(res.token);
      onAuthenticated(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(type: 'player' | 'admin') {
    setTab('login');
    setError(null);
    if (type === 'admin') {
      setEmail('admin@ludostar.app');
      setPassword('LudoStarAdmin2026!');
    } else {
      setEmail('player@ludostar.app');
      setPassword('LudoStarPlayer2026!');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ludo-auth-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#0F1E36] border border-white/15 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 id="ludo-auth-title" className="text-lg font-extrabold text-white">
                {tab === 'login' ? 'Sign In to LUDO STAR' : 'Create Player Account'}
              </h2>
              <p className="text-xs text-slate-400">Sync coins, streaks &amp; leaderboard stats</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#081222] border border-white/10">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === 'login' ? 'bg-[#F59E0B] text-[#081222]' : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === 'register'
                ? 'bg-[#F59E0B] text-[#081222]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/35 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Player Name</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081222] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@ludostar.app"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#081222] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#081222] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#F59E0B] hover:bg-amber-400 disabled:opacity-60 text-[#081222] text-sm font-extrabold transition-colors"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account (+500 Coins)'}
          </button>
        </form>

        <div className="pt-2 border-t border-white/10 space-y-2">
          <p className="text-[11px] text-slate-400 text-center">Quick Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('player')}
              className="py-2 px-3 rounded-lg bg-[#162947] hover:bg-[#1E355B] text-xs font-semibold text-white transition-colors"
            >
              Demo Player
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="py-2 px-3 rounded-lg bg-[#162947] hover:bg-[#1E355B] text-xs font-semibold text-amber-300 transition-colors"
            >
              Admin Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
