import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameStateService } from './state-machine/game-state.service';
import { ChessRuleService } from './rules/chess-rule.service';

@Module({
  controllers: [GameController],
  providers: [GameService, GameStateService, ChessRuleService],
  exports: [GameService, GameStateService, ChessRuleService]
})
export class GameModule {}