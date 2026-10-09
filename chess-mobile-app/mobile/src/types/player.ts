// ============================================================
// Player Type Definitions
// ============================================================

export interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  rating: number;
  gold: number;
  gems: number;
  maxHP: number;
  currentHP: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
  lastOnline: string;
}

export interface PlayerStats {
  totalGames: number;
  winRate: number;
  avgGameDuration: number;
  longestWinStreak: number;
  currentWinStreak: number;
  favoriteOpening: string;
  totalCardsUsed: number;
  totalPiecesCaptured: number;
}

export interface PlayerCurrency {
  gold: number;
  gems: number;
}

export interface PlayerHP {
  current: number;
  max: number;
  shield: number; // additional HP from shield card
}

export interface LeaderboardEntry {
  rank: number;
  player: PlayerProfile;
  rating: number;
  wins: number;
}
