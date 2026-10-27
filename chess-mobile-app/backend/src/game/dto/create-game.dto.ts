export class CreateGameDto {
  gameId?: string;
  whitePlayerId: string;
  blackPlayerId?: string;
  mode?: string; // 'PVP' | 'BOT' | 'bot_easy' | 'bot_medium'
  botDifficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'easy' | 'medium' | 'hard';
  initialHp?: number;
  initialTimeMs?: number;
  reconnectTimeoutMs?: number;
}