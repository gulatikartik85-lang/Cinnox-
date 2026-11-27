import React, { useState } from 'react';
import { Bot, Globe, Home, Menu, Mic, Siren, User as UserIcon, X } from 'lucide-react';
import { HELP_HUBS } from '../data/helpHubs';
import type { UserProfile } from '../lib/helpworldApi';

interface TopBarProps {
  currentPath: string;
  user: UserProfile | null;
  onNavigate: (path: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ currentPath, user, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'All Hubs', path: '/' },
    { label: 'Assistant', path: '/hub/assistant' },
    { label: 'Emergency', path: '/hub/emergency' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Plus', path: '/plus' },
  ];

  const go = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#050912]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-8">
        {/* Zone 1: Clean single-line brand wordmark */}
        <a
          href="/"
          onClick={(e) => go(e, '/')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2.5"
        >
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-xl hw-accent-gradient inline-flex items-center justify-center text-white shadow-sm"
          >
            <Globe className="w-4 h-4" />
          </span>
          <span>HelpWorld AI</span>
        </a>

        {/* Zone 2: 5 concise single-line text links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {navLinks.map((item) => {
            const active =
              item.path === '/' ? currentPath === '/' : currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => go(e, item.path)}
                className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-950 dark:hover:text-white ${
                  active
                    ? 'text-sky-700 dark:text-sky-300 font-semibold underline underline-offset-8 decoration-sky-500'
                    : ''
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="min-h-[40px] px-4 py-2 rounded-xl hw-accent-gradient text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="min-h-[40px] px-4 py-2 rounded-xl hw-accent-gradient text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-label="Open navigation menu"
            className="md:hidden min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080E1A] px-4 py-4 space-y-1.5 shadow-xl">
          {navLinks.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => go(e, item.path)}
              className="flex items-center min-h-[44px] px-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {item.label}
            </a>
          ))}
          <a
            href="/privacy"
            onClick={(e) => go(e, '/privacy')}
            className="flex items-center min-h-[44px] px-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          >
            Privacy &amp; Safety
          </a>
        </div>
      )}
    </header>
  );
};

export const MobileBottomNav: React.FC<{
  currentPath: string;
  onNavigate: (path: string) => void;
}> = ({ currentPath, onNavigate }) => {
  const tabs = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Assistant', path: '/hub/assistant', icon: Bot },
    { label: 'Voice', path: '/hub/voice', icon: Mic },
    { label: 'SOS', path: '/hub/emergency', icon: Siren },
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#050912]/95 backdrop-blur-md pb-safe"
    >
      <div className="grid grid-cols-4 h-14 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = currentPath === tab.path;
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => onNavigate(tab.path)}
              className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                tab.path === '/hub/emergency'
                  ? active
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : 'text-red-500 dark:text-red-400/90'
                  : active
                    ? 'text-sky-600 dark:text-sky-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const Footer: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const go = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#04070F] mt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-3">
            <a
              href="/"
              onClick={(e) => go(e, '/')}
              className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white inline-flex items-center gap-2.5"
            >
              <span className="w-8 h-8 rounded-xl hw-accent-gradient inline-flex items-center justify-center text-white">
                <Globe className="w-4 h-4" />
              </span>
              <span>HelpWorld AI</span>
            </a>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              One App for Everyone. Free everyday AI assistance for learning, jobs, health
              education, translation, budgeting, legal awareness, and emergency safety.
            </p>
          </div>

          <div className="md:col-span-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              14 HelpWorld Modules
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
              {HELP_HUBS.map((hub) => (
                <a
                  key={hub.slug}
                  href={`/hub/${hub.slug}`}
                  onClick={(e) => go(e, `/hub/${hub.slug}`)}
                  className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors truncate"
                >
                  {hub.name}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Account, Plus &amp; Trust
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a href="/dashboard" onClick={(e) => go(e, '/dashboard')} className="hover:text-sky-500">
                  Personalised Dashboard
                </a>
              </li>
              <li>
                <a href="/plus" onClick={(e) => go(e, '/plus')} className="hover:text-sky-500">
                  HelpWorld Plus (Optional)
                </a>
              </li>
              <li>
                <a href="/privacy" onClick={(e) => go(e, '/privacy')} className="hover:text-sky-500">
                  Privacy &amp; Data Protection
                </a>
              </li>
              <li>
                <a href="/terms" onClick={(e) => go(e, '/terms')} className="hover:text-sky-500">
                  Terms &amp; Safety Guidelines
                </a>
              </li>
              <li>
                <a href="/contact" onClick={(e) => go(e, '/contact')} className="hover:text-sky-500">
                  Contact &amp; Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>© {new Date().getFullYear()} HelpWorld AI – One App for Everyone.</span>
          <span>Basic everyday AI help is free for all users without forced payments.</span>
        </div>
      </div>
    </footer>
  );
};
