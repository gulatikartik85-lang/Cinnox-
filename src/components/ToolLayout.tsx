import React from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { AI_TOOLS, type AiToolMeta } from '../data/toolsCatalog';
import { ToolIcon } from './ToolIcon';
import { AdSenseSlot } from './AdSenseSlot';
import { cinnoxApi, type UserProfile } from '../lib/cinnoxApi';

interface ToolLayoutProps {
  tool: AiToolMeta;
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  tool,
  user,
  onUserUpdated,
  onNavigate,
  children,
}) => {
  const isFav = Boolean(user?.favoriteTools?.includes(tool.slug));

  const toggleFav = async () => {
    if (!user) {
      onNavigate('/login');
      return;
    }
    try {
      const res = await cinnoxApi.toggleFavorite(tool.slug);
      onUserUpdated(res.user);
    } catch {
      // ignore
    }
  };

  const relatedTools = AI_TOOLS.filter(
    (t) => t.category === tool.category && t.slug !== tool.slug
  ).slice(0, 4);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Contextual Top Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-indigo-950/70">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-300 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All 15 Tools</span>
            </button>
            <span aria-hidden="true">/</span>
            <span>{tool.categoryLabel}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 dark:text-white font-medium">{tool.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl cinnox-accent-gradient text-white flex items-center justify-center shrink-0">
              <ToolIcon slug={tool.slug} className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {tool.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {tool.tagline}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={toggleFav}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isFav
                ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                : 'border-slate-200 dark:border-indigo-900/70 text-slate-700 dark:text-slate-200 hover:border-violet-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
            <span>{isFav ? 'Saved to Favorites' : 'Favorite Studio'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio + Sidebar Ad Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-9 min-w-0">{children}</div>

        <aside className="no-print lg:col-span-3 space-y-6">
          <AdSenseSlot
            variant="sidebar"
            pagePath={`/tools/${tool.slug}`}
            onNavigate={onNavigate}
          />

          <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5 space-y-3">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Related Studios
            </h2>
            <div className="space-y-1.5">
              {relatedTools.map((rel) => (
                <button
                  key={rel.slug}
                  type="button"
                  onClick={() => onNavigate(`/tools/${rel.slug}`)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-indigo-950/40 text-left transition-colors cursor-pointer"
                >
                  <ToolIcon
                    slug={rel.slug}
                    className="w-4 h-4 text-violet-600 dark:text-violet-300 shrink-0"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                    {rel.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Responsive Banner */}
      <div className="no-print pt-4">
        <AdSenseSlot
          variant="banner"
          pagePath={`/tools/${tool.slug}`}
          onNavigate={onNavigate}
        />
      </div>
    </main>
  );
};
