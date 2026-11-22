// Google AdMob Configuration for LUDO STAR
// Uses official Google AdMob Test Ad Unit IDs in development/testing.
// Replace the `production` placeholders (or set VITE_ADMOB_* env vars) before building a release APK/AAB.

export const ADMOB_TEST_IDS = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  native: 'ca-app-pub-3940256099942544/2247696110',
} as const;

export const ADMOB_PRODUCTION_IDS = {
  appId: import.meta.env.VITE_ADMOB_APP_ID || 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
  banner: import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-XXXXXXXXXXXXXXXX/1111111111',
  interstitial: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-XXXXXXXXXXXXXXXX/2222222222',
  rewarded: import.meta.env.VITE_ADMOB_REWARDED_ID || 'ca-app-pub-XXXXXXXXXXXXXXXX/3333333333',
  native: import.meta.env.VITE_ADMOB_NATIVE_ID || 'ca-app-pub-XXXXXXXXXXXXXXXX/4444444444',
} as const;

const hasRealIds =
  !ADMOB_PRODUCTION_IDS.appId.includes('XXXX') &&
  import.meta.env.VITE_ADMOB_TEST_MODE === 'false';

export const ADMOB_ACTIVE_CONFIG = {
  isTestMode: !hasRealIds,
  interstitialMatchFrequency: 2, // Show interstitial after every 2-3 completed matches
  rewardedCoinBonus: 150,
  ids: hasRealIds ? ADMOB_PRODUCTION_IDS : ADMOB_TEST_IDS,
};
