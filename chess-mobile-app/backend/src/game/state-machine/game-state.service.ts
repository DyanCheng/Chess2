import { Injectable, BadRequestException } from '@nestjs/common';
import { GameState } from './game-state.enum';

@Injectable()
export class GameStateService {
  // BE-012: Cấu hình State Machine
  private allowedTransitions = new Map<GameState, GameState[]>([
    [GameState.WAITING, [GameState.READY, GameState.CANCELLED]],
    [GameState.READY, [GameState.PLAYING, GameState.CANCELLED, GameState.DISCONNECTED]],
    [GameState.PLAYING, [GameState.FINISHED, GameState.DRAW, GameState.DISCONNECTED, GameState.ABANDONED]],
    [GameState.DISCONNECTED, [GameState.PLAYING, GameState.ABANDONED]],
    [GameState.FINISHED, []],
    [GameState.CANCELLED, []],
    [GameState.ABANDONED, []],
    [GameState.DRAW, []],
  ]);

  canTransition(currentState: GameState, nextState: GameState): boolean {
    const allowed = this.allowedTransitions.get(currentState);
    return allowed ? allowed.includes(nextState) : false;
  }

  transition(currentState: GameState, nextState: GameState): GameState {
    if (!this.canTransition(currentState, nextState)) {
      throw new BadRequestException(`Không thể chuyển trạng thái từ ${currentState} sang ${nextState}`);
    }
    return nextState;
  }
}