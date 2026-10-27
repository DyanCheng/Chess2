import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [BotModule, GameModule, MatchmakingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}