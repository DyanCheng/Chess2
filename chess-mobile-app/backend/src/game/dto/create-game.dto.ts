// chess-mobile-app/backend/src/game/dto/create-game.dto.ts
export class CreateGameDto {
  whitePlayerId: string;
  blackPlayerId?: string;
  mode?: 'PVP' | 'BOT';
  botDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  timeControlSeconds?: number;
}