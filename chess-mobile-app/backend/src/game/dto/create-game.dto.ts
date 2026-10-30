export class CreateGameDto {
  gameId?: string;
  whitePlayerId: string;
  blackPlayerId?: string;
  mode?: 'PVP' | 'BOT';
  botDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  timeControlSeconds?: number;
  initialTimeMs?: number;
  reconnectTimeoutMs?: number;
}
