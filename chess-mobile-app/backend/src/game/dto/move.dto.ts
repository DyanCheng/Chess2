import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class MoveDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsString()
  @IsNotEmpty()
  from: string; // VD: 'e2'

  @IsString()
  @IsNotEmpty()
  to: string; // VD: 'e4'

  @IsString()
  @IsOptional()
  promotion?: string; // VD: 'q'
}