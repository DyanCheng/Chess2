import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameStateService } from './state-machine/game-state.service';

@Module({
  controllers: [GameController],
  providers: [GameService, GameStateService],
  exports: [GameService, GameStateService]
})
export class GameModule {}