import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { GameState } from '../state-machine/game-state.enum';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  hostId: string;

  @IsString()
  @IsOptional()
  guestId?: string; // Có thể null nếu đang đợi đối thủ

  @IsString()
  @IsOptional()
  gameType?: 'PvP' | 'Bot'; // Dựa trên BotGameScreen và PvPScreen
}