import { useEffect, useState, useRef } from 'react';
import { ShieldCheck, Play, X, ExternalLink, AlertTriangle, Coins } from 'lucide-react';
import { ADMOB_ACTIVE_CONFIG } from '../config/admob';
import { admobService } from '../services/admobService';
import type { AdConsentStatus } from '../types';

/* -------------------------------------------------------------------------- */
/* 1. Ad Consent Management Modal (GDPR / UMP Compliance)                      */
/* -------------------------------------------------------------------------- */
interface AdConsentModalProps {
  open: boolean;
  currentConsent: AdConsentStatus;
  onSelect: (choice: AdConsentStatus) => void;
}

export function AdConsentModal({ open, currentConsent, onSelect }: AdConsentModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#0F1E36] border border-white/15 p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 id="consent-title" className="text-lg font-extrabold text-white">
              Ad Privacy &amp; Consent
            </h2>
            <p className="text-xs text-slate-300">Google AdMob UMP Preference</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          <strong>LUDO STAR</strong> uses Google AdMob to keep the game free and offer optional bonus coin rewards. Ads are never shown during active matches. Choose how ads are displayed:
        </p>

        {currentConsent !== 'unknown' && (
          <p className="text-xs text-emerald-400">
            Current preference: {currentConsent === 'personalized' ? 'Personalized Ads' : 'Non-Personalized Ads'}
          </p>
        )}

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => onSelect('personalized')}
            className="w-full py-3 px-4 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#081222] text-sm font-bold transition-colors"
          >
            Consent to Personalized Ads
          </button>
          <button
            type="button"
            onClick={() => onSelect('non_personalized')}
            className="w-full py-3 px-4 rounded-xl bg-[#162947] hover:bg-[#1E355B] border border-white/15 text-white text-sm font-semibold transition-colors"
          >
            Use Non-Personalized Ads Only
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Home Screen Banner Ad                                                    */
/* -------------------------------------------------------------------------- */
interface AdMobBannerProps {
  consent: AdConsentStatus;
  gameplayActive: boolean;
}

export function AdMobBanner({ consent, gameplayActive }: AdMobBannerProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const loggedRef = useRef(false);

  useEffect(() => {
    if (gameplayActive || consent === 'unknown') return;
    setStatus('loading');
    const timer = window.setTimeout(() => {
      setStatus('loaded');
      admobService.showNativeBannerIfApplicable();
      if (!loggedRef.current) {
        loggedRef.current = true;
        admobService.trackEvent('banner', 'impression', ADMOB_ACTIVE_CONFIG.ids.banner);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      admobService.hideNativeBanner();
    };
  }, [gameplayActive, consent]);

  if (gameplayActive || consent === 'unknown') return null;

  return (
    <div className="w-full rounded-xl bg-[#0D1A30] border border-white/10 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      {status === 'loading' ? (
        <div className="w-full h-12 rounded-lg bg-white/5 animate-pulse flex items-center justify-center text-xs text-slate-400">
          Loading AdMob Banner...
        </div>
      ) : status === 'error' ? (
        <div className="w-full flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Ad unavailable right now
          </span>
          <button
            type="button"
            onClick={() => setStatus('loaded')}
            className="text-amber-400 hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 shrink-0">
              AD
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                Google AdMob {ADMOB_ACTIVE_CONFIG.isTestMode ? 'Test Banner' : 'Banner'} (320×50)
              </p>
              <p className="text-[11px] font-mono text-slate-400 truncate">
                Unit: {ADMOB_ACTIVE_CONFIG.ids.banner} · {consent === 'non_personalized' ? 'NPA' : 'Personalized'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              admobService.trackEvent('banner', 'click', ADMOB_ACTIVE_CONFIG.ids.banner);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#162947] hover:bg-[#1E355B] border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <span>Learn More</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Native Ad Card (Rewards & Game Lobby Screens)                           */
/* -------------------------------------------------------------------------- */
interface AdMobNativeCardProps {
  placement: 'lobby' | 'rewards' | 'post_match';
  consent: AdConsentStatus;
  gameplayActive: boolean;
}

export function AdMobNativeCard({ placement, consent, gameplayActive }: AdMobNativeCardProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (gameplayActive || consent === 'unknown') return;
    setStatus('loading');
    const timer = window.setTimeout(() => {
      setStatus('loaded');
      if (loggedRef.current !== placement) {
        loggedRef.current = placement;
        admobService.trackEvent('native', 'impression', ADMOB_ACTIVE_CONFIG.ids.native);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [placement, gameplayActive, consent]);

  if (gameplayActive || consent === 'unknown') return null;

  const placementLabel =
    placement === 'lobby'
      ? 'Game Lobby'
      : placement === 'rewards'
        ? 'Rewards'
        : 'Post-Match';

  const headline =
    placement === 'lobby'
      ? 'Challenge Friends & Win Royal Tournaments'
      : placement === 'rewards'
        ? 'Double Your Daily Streak With Bonus Coins'
        : 'Match Complete — Claim Extra Rewards';

  return (
    <div className="rounded-xl bg-[#0F1E36] border border-white/10 p-4 space-y-3 text-left">
      {status === 'loading' ? (
        <div className="h-20 rounded-lg bg-white/5 animate-pulse" />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                Sponsored
              </span>
              <span className="text-xs text-slate-400 font-medium">
                AdMob Native ({placementLabel})
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
              {ADMOB_ACTIVE_CONFIG.ids.native}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-white">{headline}</p>
              <p className="text-xs text-slate-300">
                {ADMOB_ACTIVE_CONFIG.isTestMode
                  ? 'Test Native Ad placeholder — replace VITE_ADMOB_NATIVE_ID for live campaigns.'
                  : 'Verified AdMob native campaign slot.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => admobService.trackEvent('native', 'click', ADMOB_ACTIVE_CONFIG.ids.native)}
              className="px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-amber-400 text-[#081222] text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
            >
              Visit Offer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Interstitial Ad Modal (Strictly Between Matches Every 2-3 Games)        */
/* -------------------------------------------------------------------------- */
interface AdMobInterstitialModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdMobInterstitialModal({ open, onClose }: AdMobInterstitialModalProps) {
  const [countdown, setCountdown] = useState(4);
  const loggedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      loggedRef.current = false;
      return;
    }
    setCountdown(4);
    if (!loggedRef.current) {
      loggedRef.current = true;
      admobService.trackEvent('interstitial', 'impression', ADMOB_ACTIVE_CONFIG.ids.interstitial);
    }

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Interstitial Ad"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#0F1E36] border border-white/15 p-6 shadow-2xl space-y-5 text-center">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
            AdMob Interstitial
          </span>
          {countdown > 0 ? (
            <span className="font-mono tabular-nums">Close in {countdown}s</span>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Ad</span>
            </button>
          )}
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-[#162947] to-[#091529] border border-white/10 space-y-3">
          <p className="text-lg font-extrabold text-white">
            {ADMOB_ACTIVE_CONFIG.isTestMode
              ? 'Google AdMob Test Interstitial'
              : 'Sponsored Partner Spotlight'}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Shown strictly between completed matches (every {ADMOB_ACTIVE_CONFIG.interstitialMatchFrequency} games) in compliance with AdMob frequency policies.
          </p>
          <p className="text-[11px] font-mono text-slate-400">
            Unit: {ADMOB_ACTIVE_CONFIG.ids.interstitial}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            admobService.trackEvent('interstitial', 'click', ADMOB_ACTIVE_CONFIG.ids.interstitial);
            if (countdown === 0) onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#081222] text-sm font-bold transition-colors"
        >
          Explore Sponsor Offer
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Rewarded Video Ad Modal (+150 Bonus Coins on Completion)                */
/* -------------------------------------------------------------------------- */
interface AdMobRewardedModalProps {
  open: boolean;
  onCancel: () => void;
  onRewardCompleted: (adUnitId: string) => void;
}

export function AdMobRewardedModal({
  open,
  onCancel,
  onRewardCompleted,
}: AdMobRewardedModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(6);
  const [completed, setCompleted] = useState(false);
  const loggedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      loggedRef.current = false;
      setCompleted(false);
      return;
    }

    setSecondsLeft(6);
    setCompleted(false);
    if (!loggedRef.current) {
      loggedRef.current = true;
      admobService.trackEvent('rewarded', 'impression', ADMOB_ACTIVE_CONFIG.ids.rewarded);
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const progressPct = Math.round(((6 - secondsLeft) / 6) * 100);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Rewarded Video Ad"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#0F1E36] border border-white/15 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between text-xs">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
            Rewarded Video Ad
          </span>
          {!completed ? (
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-white text-xs"
            >
              Skip (No Reward)
            </button>
          ) : (
            <span className="text-emerald-400 font-semibold">Reward Ready!</span>
          )}
        </div>

        <div className="aspect-video rounded-xl bg-gradient-to-br from-[#162947] via-[#0B172B] to-[#081222] border border-white/10 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center">
            {completed ? (
              <Coins className="w-6 h-6 text-[#F59E0B]" />
            ) : (
              <Play className="w-6 h-6 text-[#F59E0B] fill-current" />
            )}
          </div>
          <p className="text-base font-bold text-white">
            {completed
              ? `You earned +${ADMOB_ACTIVE_CONFIG.rewardedCoinBonus} Bonus Coins!`
              : 'Watching AdMob Rewarded Video...'}
          </p>
          <p className="text-[11px] font-mono text-slate-400">
            {ADMOB_ACTIVE_CONFIG.ids.rewarded}
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-300 text-center tabular-nums">
            {completed
              ? 'Video completed — claim your coins below.'
              : `Reward unlocks in ${secondsLeft}s`}
          </p>
        </div>

        {completed ? (
          <button
            type="button"
            onClick={() => onRewardCompleted(ADMOB_ACTIVE_CONFIG.ids.rewarded)}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#081222] text-sm font-extrabold transition-colors"
          >
            Claim +{ADMOB_ACTIVE_CONFIG.rewardedCoinBonus} Coins
          </button>
        ) : (
          <button
            type="button"
            onClick={() => admobService.trackEvent('rewarded', 'click', ADMOB_ACTIVE_CONFIG.ids.rewarded)}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Learn More About Advertiser
          </button>
        )}
      </div>
    </div>
  );
}
