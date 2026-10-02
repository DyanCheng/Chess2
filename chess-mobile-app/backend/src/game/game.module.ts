import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { SupabaseService } from '../database/supabase.service';

@Module({
  controllers: [GameController],
  providers: [GameService, SupabaseService],
})
export class GameModule {}