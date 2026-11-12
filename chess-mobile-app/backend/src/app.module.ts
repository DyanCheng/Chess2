import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HistoryModule } from './history/history.module';
import { IapModule } from './iap/iap.module';
import { ShopModule } from './shop/shop.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    HistoryModule,
    IapModule,
    ShopModule,
    BotModule,
    GameModule,
    MatchmakingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
