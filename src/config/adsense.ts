export const ADSENSE_CONFIG = {
  testMode: (import.meta.env.VITE_ADSENSE_TEST_MODE ?? 'true') !== 'false',
  clientId: import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-xxxxxxxxxxxxxxxx',
  slots: {
    banner: import.meta.env.VITE_ADSENSE_SLOT_BANNER || '1111111111',
    infeed: import.meta.env.VITE_ADSENSE_SLOT_INFEED || '2222222222',
    sidebar: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR || '3333333333',
  },
};

export function isLiveAdSenseConfigured(): boolean {
  return (
    !ADSENSE_CONFIG.testMode &&
    ADSENSE_CONFIG.clientId.startsWith('ca-pub-') &&
    !ADSENSE_CONFIG.clientId.includes('xxxx')
  );
}
