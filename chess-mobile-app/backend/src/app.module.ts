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
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CardsModule } from './cards/cards.module';
import { CurrencyModule } from './currency/currency.module';
import { LogsModule } from './logs/logs.module';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { PresenceModule } from './presence/presence.module';
import { RoomsModule } from './rooms/rooms.module';
import { CatalogModule } from './catalog/catalog.module';
import { RankModule } from './rank/rank.module';
import { PuzzlesModule } from './puzzles/puzzles.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    HistoryModule,
    IapModule,
    ShopModule,
    CardsModule,
    CurrencyModule,
    LogsModule,
    PresenceModule,
    RoomsModule,
    CatalogModule,
    RankModule,
    PuzzlesModule,
    BotModule,
    GameModule,
    MatchmakingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
