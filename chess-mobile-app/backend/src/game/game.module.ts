import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GameStateService } from './state-machine/game-state.service';
import { ChessRuleService } from './rules/chess-rule.service';
import { CheckService } from './rules/check.service';
import { CheckmateService } from './rules/checkmate.service';
import { HpService } from './hp/hp.service';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [BotModule],
  controllers: [GameController],
  providers: [
    GameService,
    GameGateway,
    GameStateService,
    ChessRuleService,
    CheckService,
    CheckmateService,
    HpService,
  ],
  exports: [GameService, GameStateService, HpService, CheckmateService],
})
export class GameModule {}