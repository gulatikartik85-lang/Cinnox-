import React, { useEffect, useRef } from 'react';
import { ADSENSE_CONFIG, isLiveAdSenseConfigured } from '../config/adsense';
import { cinnoxApi } from '../lib/cinnoxApi';
import { ExternalLink, Megaphone } from 'lucide-react';

interface AdSenseSlotProps {
  variant: 'banner' | 'infeed' | 'sidebar';
  pagePath: string;
  onNavigate?: (path: string) => void;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({ variant, pagePath, onNavigate }) => {
  const reportedRef = useRef(false);
  const liveAdSense = isLiveAdSenseConfigured();
  const slotId =
    variant === 'banner'
      ? ADSENSE_CONFIG.slots.banner
      : variant === 'infeed'
        ? ADSENSE_CONFIG.slots.infeed
        : ADSENSE_CONFIG.slots.sidebar;

  useEffect(() => {
    if (!reportedRef.current) {
      reportedRef.current = true;
      cinnoxApi.trackAdEvent(slotId, 'impression', pagePath);
    }
  }, [slotId, pagePath]);

  useEffect(() => {
    if (!liveAdSense) return;
    const scriptId = 'cinnox-adsense-script';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.clientId}`;
      document.head.appendChild(s);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script still initializing
    }
  }, [liveAdSense]);

  if (liveAdSense) {
    return (
      <div
        className={`w-full overflow-hidden rounded-xl border border-violet-300/60 dark:border-violet-800/60 bg-white dark:bg-[#0B0E20] p-3 text-center ${
          variant === 'banner' ? 'min-h-[100px]' : variant === 'sidebar' ? 'min-h-[250px]' : 'min-h-[140px]'
        }`}
      >
        <div className="mb-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-300">
          Advertisement
        </div>
        <ins
          className="adsbygoogle block w-full"
          data-ad-client={ADSENSE_CONFIG.clientId}
          data-ad-slot={slotId}
          data-ad-format={variant === 'banner' ? 'horizontal' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  const heightClass =
    variant === 'banner'
      ? 'min-h-[96px]'
      : variant === 'sidebar'
        ? 'min-h-[240px]'
        : 'min-h-[118px]';

  return (
    <aside
      aria-label="Google AdSense Responsive Ad Space"
      className={`w-full rounded-2xl border border-violet-300/80 dark:border-violet-700/50 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 dark:from-[#14102E] dark:via-[#0E1330] dark:to-[#0A1733] px-5 py-4 ${heightClass} flex flex-col justify-between transition-colors shadow-sm`}
    >
      <div className="flex items-center justify-between gap-4 text-[11px] font-medium text-violet-700 dark:text-violet-300">
        <span className="inline-flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5" />
          <span>Sponsored · Google AdSense Responsive Unit</span>
        </span>
        <span className="font-mono tabular-nums text-[11px] text-blue-600 dark:text-blue-300">
          Slot {slotId}
        </span>
      </div>

      <div
        className={`my-2 flex ${
          variant === 'sidebar' ? 'flex-col items-start gap-3' : 'flex-col sm:flex-row sm:items-center justify-between gap-3'
        }`}
      >
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Google AdSense {variant === 'banner' ? 'Responsive Banner' : variant === 'sidebar' ? 'Sidebar Unit (300×250)' : 'In-Feed Ad Space'}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Ready for your live Publisher ID (`VITE_ADSENSE_CLIENT_ID`). Set `VITE_ADSENSE_TEST_MODE=false` to serve live Google Ads.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            cinnoxApi.trackAdEvent(slotId, 'click', pagePath);
            if (onNavigate) {
              onNavigate('/contact');
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white cinnox-accent-gradient hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Advertise Here</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
