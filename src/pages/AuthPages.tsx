import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cinnoxApi, type UserProfile } from '../lib/cinnoxApi';

interface AuthPageProps {
  mode: 'login' | 'signup';
  onSuccess: (user: UserProfile) => void;
  onNavigate: (path: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode, onSuccess, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res =
        mode === 'signup'
          ? await cinnoxApi.register({ name, email, password })
          : await cinnoxApi.login({ email, password });
      onSuccess(res.user);
      onNavigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12 cinnox-hero-mesh">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-indigo-900/70 bg-white dark:bg-[#0B0E1D] p-7 sm:p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-xs font-medium text-violet-600 dark:text-violet-300">
            Cinnox Account
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {mode === 'signup' ? 'Create your free account' : 'Sign in to Cinnox'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {mode === 'signup'
              ? 'Save generated assets, favorite tools, and chat threads to your personal dashboard.'
              : 'Access your saved generations, favorite tools, and studio history.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-60 transition-opacity cursor-pointer"
          >
            <span>
              {loading
                ? mode === 'signup'
                  ? 'Creating Account...'
                  : 'Signing In...'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Sign In'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-indigo-950/70 text-center text-xs text-slate-600 dark:text-slate-400">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="font-semibold text-violet-600 dark:text-violet-300 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              New to Cinnox?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/signup')}
                className="font-semibold text-violet-600 dark:text-violet-300 hover:underline cursor-pointer"
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
