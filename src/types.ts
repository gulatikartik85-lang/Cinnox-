export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type GameMode =
  | 'vs_ai_2p'
  | 'vs_ai_4p'
  | 'local_2p'
  | 'local_4p'
  | 'online_private'
  | 'online_public';

export type AdConsentStatus = 'unknown' | 'personalized' | 'non_personalized';

export type AdType = 'banner' | 'interstitial' | 'rewarded' | 'native';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl: string;
  coins: number;
  wins: number;
  matchesPlayed: number;
  dailyStreak: number;
  lastDailyClaim: string | null;
  adConsent: AdConsentStatus;
  createdAt: string;
}

export interface TokenState {
  id: number; // 0..3
  color: PlayerColor;
  pos: number; // -1 = yard, 0..50 = outer track relative, 51..55 = home stretch, 56 = home goal
}

export interface PlayerSeat {
  color: PlayerColor;
  name: string;
  avatarUrl: string;
  isBot: boolean;
  userId?: number | null;
  connected?: boolean;
  finishedOrder: number | null; // 1 = winner, 2 = 2nd, etc.
}

export interface LudoGameState {
  roomId: string;
  roomCode?: string;
  mode: GameMode;
  status: 'waiting' | 'playing' | 'finished';
  players: PlayerSeat[];
  tokens: Record<PlayerColor, TokenState[]>;
  currentTurnIndex: number;
  phase: 'awaiting_roll' | 'awaiting_move' | 'finished';
  diceValue: number | null;
  consecutiveSixes: number;
  lastAction: string;
  winnerColor: PlayerColor | null;
  turnCount: number;
  startedAt: number;
  chatMessages?: Array<{
    id: string;
    sender: string;
    color: PlayerColor;
    text: string;
    ts: number;
  }>;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  avatarUrl: string;
  wins: number;
  matchesPlayed: number;
  coins: number;
}

export interface MatchRecord {
  id: number;
  mode: string;
  winnerName: string;
  winnerColor: string;
  playersCount: number;
  durationSeconds: number;
  createdAt: string;
}

export interface AdStatsSummary {
  totals: {
    impressions: number;
    clicks: number;
    rewards: number;
    errors: number;
    estimatedRevenueUsd: number;
    ctrPercent: number;
  };
  byType: Array<{
    adType: AdType;
    impressions: number;
    clicks: number;
    rewards: number;
    estimatedRevenueUsd: number;
  }>;
  gameStats: {
    totalUsers: number;
    totalMatches: number;
    activeRooms: number;
    totalCoinsInCirculation: number;
  };
  recentMatches: MatchRecord[];
}
