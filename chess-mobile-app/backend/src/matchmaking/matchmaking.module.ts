// chess-mobile-app/backend/src/matchmaking/matchmaking.module.ts
import { Module } from '@nestjs/common';
import { MatchmakingQueue } from './queue/matchmaking.queue';
import { MatchmakingService } from './matchmaking.service';
import { MatchmakingGateway } from './matchmaking.gateway';
import { GameModule } from '../game/game.module';

@Module({
  imports: [GameModule],
  providers: [MatchmakingQueue, MatchmakingService, MatchmakingGateway],
  exports: [MatchmakingService, MatchmakingQueue],
})
export class MatchmakingModule {}