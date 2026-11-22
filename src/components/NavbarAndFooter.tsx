import React, { useState } from 'react';
import { Menu, Moon, Palette, Sun, X, User as UserIcon } from 'lucide-react';
import { AI_TOOLS } from '../data/toolsCatalog';
import type { UserProfile } from '../lib/cinnoxApi';

export type AccentTheme = 'purple-blue' | 'indigo-cyan' | 'violet-rose' | 'sapphire-emerald';

const ACCENT_OPTIONS: Array<{ id: AccentTheme; label: string; swatch: string }> = [
  { id: 'purple-blue', label: 'Purple & Blue', swatch: 'linear-gradient(135deg, #8B5CF6, #2563EB)' },
  { id: 'indigo-cyan', label: 'Indigo & Cyan', swatch: 'linear-gradient(135deg, #6366F1, #06B6D4)' },
  { id: 'violet-rose', label: 'Violet & Rose', swatch: 'linear-gradient(135deg, #9333EA, #EC4899)' },
  { id: 'sapphire-emerald', label: 'Sapphire & Emerald', swatch: 'linear-gradient(135deg, #2563EB, #10B981)' },
];

interface NavbarProps {
  currentPath: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  accentTheme: AccentTheme;
  onChangeAccent: (accent: AccentTheme) => void;
  user: UserProfile | null;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  theme,
  onToggleTheme,
  accentTheme,
  onChangeAccent,
  user,
  onNavigate,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const navItems = [
    { label: 'All Tools', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Partners', path: '/#partners' },
    { label: 'Privacy', path: '/privacy' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setMobileOpen(false);
    setPaletteOpen(false);
    onNavigate(path);
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 dark:border-indigo-950/70 bg-white/85 dark:bg-[#06070E]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean wordmark */}
        <a
          href="/"
          onClick={(e) => handleNav(e, '/')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2.5"
        >
          <span
            aria-hidden="true"
            className="w-7 h-7 rounded-lg cinnox-accent-gradient inline-flex items-center justify-center text-white text-xs font-extrabold shadow-sm"
          >
            CX
          </span>
          <span>Cinnox</span>
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navItems.map((item) => {
            const active =
              item.path === '/'
                ? currentPath === '/'
                : !item.path.includes('#') && currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNav(e, item.path)}
                className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-950 dark:hover:text-white ${
                  active
                    ? 'text-violet-700 dark:text-violet-300 font-semibold underline underline-offset-8 decoration-violet-500'
                    : ''
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Color Palette + Theme Switch + 1 primary action */}
        <div className="flex items-center gap-2 shrink-0 relative">
          <button
            type="button"
            onClick={() => setPaletteOpen((p) => !p)}
            aria-label="Change gradient color theme"
            title="Change color theme"
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-indigo-900/70 bg-slate-100/80 dark:bg-[#0D1020] text-slate-700 dark:text-slate-200 hover:border-violet-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Palette className="w-4 h-4" />
          </button>

          {paletteOpen && (
            <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 dark:border-indigo-900/80 bg-white dark:bg-[#0B0E1D] shadow-xl p-1.5 z-50">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChangeAccent(opt.id);
                    setPaletteOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                    accentTheme === opt.id
                      ? 'bg-violet-500/15 text-violet-700 dark:text-violet-200 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-indigo-950/50'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                    style={{ background: opt.swatch }}
                  />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-indigo-900/70 bg-slate-100/80 dark:bg-[#0D1020] text-slate-700 dark:text-slate-200 hover:border-violet-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white cinnox-accent-gradient hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="max-w-[110px] truncate">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white cinnox-accent-gradient hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden w-9 h-9 rounded-lg border border-slate-200 dark:border-indigo-900/70 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#080A14] px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => handleNav(e, item.path)}
              className="block py-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-indigo-950/40"
            >
              {item.label}
            </a>
          ))}
          {!user && (
            <a
              href="/signup"
              onClick={(e) => handleNav(e, '/signup')}
              className="block py-2 px-3 rounded-lg text-sm font-semibold text-violet-600 dark:text-violet-300 hover:bg-slate-100 dark:hover:bg-indigo-950/40"
            >
              Create Free Account
            </a>
          )}
        </div>
      )}
    </header>
  );
};

export const Footer: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const go = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="no-print border-t border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#05060C] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-3">
            <a
              href="/"
              onClick={(e) => go(e, '/')}
              className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white inline-flex items-center gap-2.5"
            >
              <span className="w-7 h-7 rounded-lg cinnox-accent-gradient inline-flex items-center justify-center text-white text-xs font-extrabold">
                CX
              </span>
              <span>Cinnox</span>
            </a>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              15 specialized AI studios for image synthesis, vector branding, video storyboards,
              natural speech, code, resumes, and global content production.
            </p>
          </div>

          <div className="md:col-span-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              AI Tool Studios
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
              {AI_TOOLS.map((tool) => (
                <a
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  onClick={(e) => go(e, `/tools/${tool.slug}`)}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors truncate"
                >
                  {tool.name}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Account &amp; Legal
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href="/dashboard"
                  onClick={(e) => go(e, '/dashboard')}
                  className="hover:text-violet-600 dark:hover:text-violet-300"
                >
                  User Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  onClick={(e) => go(e, '/login')}
                  className="hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Sign In
                </a>
              </li>
              <li>
                <a
                  href="/signup"
                  onClick={(e) => go(e, '/signup')}
                  className="hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Create Account
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => go(e, '/privacy')}
                  className="hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => go(e, '/terms')}
                  className="hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => go(e, '/contact')}
                  className="hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-indigo-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>© {new Date().getFullYear()} Cinnox. All rights reserved.</span>
          <span>Advertising &amp; partner disclosures available in Privacy Policy.</span>
        </div>
      </div>
    </footer>
  );
};
