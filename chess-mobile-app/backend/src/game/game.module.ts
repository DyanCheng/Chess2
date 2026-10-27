// chess-mobile-app/backend/src/game/game.module.ts
import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GameStateService } from './state-machine/game-state.service';
import { ChessRuleService } from './rules/chess-rule.service';

@Module({
  controllers: [GameController],
  providers: [GameStateService, ChessRuleService, GameService, GameGateway],
  exports: [GameStateService, GameService],
})
export class GameModule {}
