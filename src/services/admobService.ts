import { ADMOB_ACTIVE_CONFIG } from '../config/admob';
import { ludoApi } from '../lib/ludoApi';
import type { AdConsentStatus, AdType } from '../types';

const CONSENT_STORAGE_KEY = 'ludostar_ad_consent';
const MATCH_COUNTER_KEY = 'ludostar_completed_matches';

interface CapacitorAdMobPlugin {
  initialize: (opts: { initializeForTesting: boolean }) => Promise<void>;
  showBanner: (opts: { adId: string; isTesting: boolean; npa?: boolean }) => Promise<void>;
  hideBanner: () => Promise<void>;
  prepareInterstitial: (opts: { adId: string; isTesting: boolean; npa?: boolean }) => Promise<void>;
  showInterstitial: () => Promise<void>;
  prepareRewardVideoAd: (opts: { adId: string; isTesting: boolean; npa?: boolean }) => Promise<void>;
  showRewardVideoAd: () => Promise<{ type: string; amount: number }>;
}

function getNativeAdMob(): CapacitorAdMobPlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (
    window as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        Plugins?: { AdMob?: CapacitorAdMobPlugin };
      };
    }
  ).Capacitor;
  if (cap?.isNativePlatform?.() && cap.Plugins?.AdMob) {
    return cap.Plugins.AdMob;
  }
  return null;
}

class AdMobService {
  private initialized = false;
  public isGameplayActive = false;

  getConsent(): AdConsentStatus {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored === 'personalized' || stored === 'non_personalized') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'unknown';
  }

  async setConsent(choice: AdConsentStatus): Promise<void> {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    await ludoApi.saveConsent(choice).catch(() => {});
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    const native = getNativeAdMob();
    if (native) {
      try {
        await native.initialize({ initializeForTesting: ADMOB_ACTIVE_CONFIG.isTestMode });
      } catch (err) {
        await this.trackEvent('banner', 'error', ADMOB_ACTIVE_CONFIG.ids.banner);
        console.warn('AdMob native init failed:', err);
      }
    }
    this.initialized = true;
  }

  setGameplayActive(active: boolean): void {
    this.isGameplayActive = active;
    const native = getNativeAdMob();
    if (native && active) {
      native.hideBanner().catch(() => {});
    }
  }

  shouldShowInterstitialAfterMatch(): boolean {
    try {
      const current = Number(localStorage.getItem(MATCH_COUNTER_KEY) || '0') + 1;
      localStorage.setItem(MATCH_COUNTER_KEY, String(current));
      // Show interstitial after every 2 completed matches (within 2-3 policy window)
      return current % ADMOB_ACTIVE_CONFIG.interstitialMatchFrequency === 0;
    } catch {
      return false;
    }
  }

  async showNativeBannerIfApplicable(): Promise<void> {
    if (this.isGameplayActive || this.getConsent() === 'unknown') return;
    const native = getNativeAdMob();
    if (!native) return;
    try {
      await native.showBanner({
        adId: ADMOB_ACTIVE_CONFIG.ids.banner,
        isTesting: ADMOB_ACTIVE_CONFIG.isTestMode,
        npa: this.getConsent() === 'non_personalized',
      });
    } catch {
      await this.trackEvent('banner', 'error', ADMOB_ACTIVE_CONFIG.ids.banner);
    }
  }

  async hideNativeBanner(): Promise<void> {
    const native = getNativeAdMob();
    if (native) {
      await native.hideBanner().catch(() => {});
    }
  }

  async triggerNativeInterstitial(): Promise<boolean> {
    if (this.isGameplayActive) return false;
    const native = getNativeAdMob();
    if (!native) return false;
    try {
      await native.prepareInterstitial({
        adId: ADMOB_ACTIVE_CONFIG.ids.interstitial,
        isTesting: ADMOB_ACTIVE_CONFIG.isTestMode,
        npa: this.getConsent() === 'non_personalized',
      });
      await native.showInterstitial();
      await this.trackEvent('interstitial', 'impression', ADMOB_ACTIVE_CONFIG.ids.interstitial);
      return true;
    } catch {
      await this.trackEvent('interstitial', 'error', ADMOB_ACTIVE_CONFIG.ids.interstitial);
      return false;
    }
  }

  async triggerNativeRewarded(): Promise<boolean> {
    if (this.isGameplayActive) return false;
    const native = getNativeAdMob();
    if (!native) return false;
    try {
      await native.prepareRewardVideoAd({
        adId: ADMOB_ACTIVE_CONFIG.ids.rewarded,
        isTesting: ADMOB_ACTIVE_CONFIG.isTestMode,
        npa: this.getConsent() === 'non_personalized',
      });
      await native.showRewardVideoAd();
      await this.trackEvent('rewarded', 'impression', ADMOB_ACTIVE_CONFIG.ids.rewarded);
      return true;
    } catch {
      await this.trackEvent('rewarded', 'error', ADMOB_ACTIVE_CONFIG.ids.rewarded);
      return false;
    }
  }

  async trackEvent(
    adType: AdType,
    eventType: 'impression' | 'click' | 'reward' | 'error',
    adUnitId: string
  ): Promise<void> {
    await ludoApi.recordAdEvent({ adType, eventType, adUnitId }).catch(() => {});
  }
}

export const admobService = new AdMobService();
