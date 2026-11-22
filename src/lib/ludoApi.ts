import type {
  AdConsentStatus,
  AdStatsSummary,
  AdType,
  LeaderboardEntry,
  User,
} from '../types';

const TOKEN_KEY = 'ludostar_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const ludoApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  me: () => request<{ user: User }>('/api/auth/me'),

  updateProfile: (name: string) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  saveConsent: (consent: AdConsentStatus) =>
    request<{ adConsent: AdConsentStatus }>('/api/auth/consent', {
      method: 'POST',
      body: JSON.stringify({ consent }),
    }),

  getLeaderboard: () => request<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard'),

  getPublicRooms: () =>
    request<{
      rooms: Array<{ roomCode: string; playersCount: number; maxPlayers: number; hostName: string }>;
    }>('/api/rooms/public'),

  completeMatch: (payload: {
    mode: string;
    winnerName: string;
    winnerColor: string;
    playersCount: number;
    durationSeconds: number;
    humanWon: boolean;
  }) =>
    request<{ recorded: boolean; coinsEarned: number; user: User | null }>('/api/matches/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  claimDailyReward: () =>
    request<{ coinsAwarded: number; user: User }>('/api/rewards/daily', {
      method: 'POST',
    }),

  claimRewardedAdBonus: (adUnitId: string) =>
    request<{ coinsAwarded: number; user: User }>('/api/rewards/ad-bonus', {
      method: 'POST',
      body: JSON.stringify({ adUnitId }),
    }),

  recordAdEvent: (payload: {
    adType: AdType;
    eventType: 'impression' | 'click' | 'reward' | 'error';
    adUnitId: string;
  }) =>
    request<{ recorded: boolean }>('/api/ads/event', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminStats: () => request<AdStatsSummary>('/api/admin/stats'),

  getAdminUsers: () => request<{ users: User[] }>('/api/admin/users'),

  updateUserRole: (id: number, role: 'user' | 'admin') =>
    request<{ user: User }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
};
