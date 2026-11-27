import React, { useEffect } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { helpworldApi } from '../lib/helpworldApi';

export const ADMOB_CONFIG = {
  testMode: import.meta.env.VITE_ADMOB_TEST_MODE !== 'false',
  appId: import.meta.env.VITE_ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
  bannerId: import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111',
  nativeId: import.meta.env.VITE_ADMOB_NATIVE_ID || 'ca-app-pub-3940256099942544/2247696110',
};

interface AdMobSlotProps {
  variant: 'banner' | 'native';
  pagePath: string;
  isPlusUser?: boolean;
  onOpenPlus: () => void;
}

export const AdMobSlot: React.FC<AdMobSlotProps> = ({
  variant,
  pagePath,
  isPlusUser = false,
  onOpenPlus,
}) => {
  const unitId = variant === 'banner' ? ADMOB_CONFIG.bannerId : ADMOB_CONFIG.nativeId;

  useEffect(() => {
    if (isPlusUser) return;
    helpworldApi.trackAdEvent(`admob-${variant}`, 'impression', pagePath);
  }, [isPlusUser, variant, pagePath]);

  // Optional HelpWorld Plus removes ads cleanly without blocking any core feature
  if (isPlusUser) return null;

  return (
    <aside
      aria-label="Sponsored Google AdMob placement"
      data-admob-unit={unitId}
      className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0B1220] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-sky-700 dark:text-sky-400">
            Sponsored · Google AdMob
          </span>
          <span aria-hidden="true">·</span>
          <span>Keeps HelpWorld AI 100% free for everyone</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {variant === 'banner'
            ? 'Free Skill & Career Certification Scholarships · Learn Digital Tools Online'
            : 'Recommended Everyday Savings · Zero-Fee Student & Family Budgeting Templates'}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {ADMOB_CONFIG.testMode
            ? `AdMob Test Unit (${unitId.slice(-10)}) · Verified non-intrusive placement`
            : `AdMob Live Unit · Safe educational sponsor`}
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            helpworldApi.trackAdEvent(`admob-${variant}`, 'click', pagePath);
            onOpenPlus();
          }}
          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-sky-500 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Optional Plus (Ad-Free)</span>
        </button>
        <a
          href="/plus"
          onClick={(e) => {
            e.preventDefault();
            helpworldApi.trackAdEvent(`admob-${variant}`, 'click', pagePath);
            onOpenPlus();
          }}
          aria-label="Learn about ad sponsorship and optional HelpWorld Plus"
          className="min-h-[40px] px-3.5 py-2 rounded-xl hw-accent-gradient text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <span>Explore</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
};
