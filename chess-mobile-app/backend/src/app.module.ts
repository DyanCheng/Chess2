// chess-mobile-app/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';

@Module({
  imports: [GameModule, MatchmakingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}