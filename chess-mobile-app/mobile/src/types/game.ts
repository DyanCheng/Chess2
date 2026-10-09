// ============================================================
// Game Type Definitions
// ============================================================

import { BoardState, ChessMove, GameResult, PieceColor } from './chess';
import { CardEffect, CardInHand } from './card';
import { PlayerHP, PlayerProfile } from './player';

export type GameMode = 'pvp' | 'pve';
export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export interface BotDifficulty {
  id: string;
  level: number;
  name: string;
  description: string;
  avatarUrl: string;
  rating: number;
  searchDepth: number;
  isUnlocked: boolean;
  requiredLevel: number;
  reward: {
    gold: number;
    experience: number;
    gems?: number;
  };
}

export interface GameTimer {
  whiteTime: number;  // seconds remaining
  blackTime: number;
  increment: number;  // seconds added per move
  isWhiteTurn: boolean;
}

export interface GameState {
  id: string;
  mode: GameMode;
  status: GameStatus;
  board: BoardState;
  currentTurn: PieceColor;
  moveHistory: ChessMove[];
  timer: GameTimer;
  
  // Players
  whitePlayer: PlayerProfile;
  blackPlayer: PlayerProfile | BotDifficulty;
  
  // HP System (Sinh mệnh)
  whiteHP: PlayerHP;
  blackHP: PlayerHP;
  
  // Card System (Thẻ bài)
  whiteCards: CardInHand[];
  blackCards: CardInHand[];
  activeEffects: CardEffect[];
  
  // Game result
  result?: GameResult;
  
  // Metadata
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface MatchmakingRequest {
  playerId: string;
  rating: number;
  mode: GameMode;
  timeControl: number; // minutes
}

export interface MatchmakingStatus {
  status: 'searching' | 'found' | 'cancelled';
  estimatedWait: number;
  playersOnline: number;
  gameId?: string;
}

export interface GameHistoryEntry {
  id: string;
  mode: GameMode;
  opponent: {
    username: string;
    avatarUrl: string;
    rating: number;
  };
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  goldEarned: number;
  duration: number;
  totalMoves: number;
  date: string;
}

export interface HPDamageEvent {
  amount: number;
  source: 'piece_captured' | 'card_effect' | 'poison';
  targetColor: PieceColor;
  timestamp: number;
}

export interface HPHealEvent {
  amount: number;
  source: 'card_effect' | 'passive';
  targetColor: PieceColor;
  timestamp: number;
}
