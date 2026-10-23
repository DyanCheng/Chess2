// chess-mobile-app/backend/src/game/state-machine/game-state.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { GameState } from './game-state.enum';

@Injectable()
export class GameStateService {
  // Bảng quy định các bước chuyển trạng thái hợp lệ
  private readonly validTransitions: Record<GameState, GameState[]> = {
    [GameState.WAITING]: [GameState.STARTING, GameState.IN_PROGRESS, GameState.ABORTED],
    [GameState.STARTING]: [GameState.IN_PROGRESS, GameState.ABORTED],
    [GameState.IN_PROGRESS]: [
      GameState.CHECK,
      GameState.PAUSED,
      GameState.FINISHED,
      GameState.ABORTED,
    ],
    [GameState.CHECK]: [
      GameState.IN_PROGRESS,
      GameState.PAUSED,
      GameState.FINISHED,
    ],
    [GameState.PAUSED]: [
      GameState.IN_PROGRESS,
      GameState.CHECK,
      GameState.FINISHED,
      GameState.ABORTED,
    ],
    [GameState.FINISHED]: [],
    [GameState.ABORTED]: [],
  };

  canTransition(from: GameState, to: GameState): boolean {
    if (from === to) return true;
    return this.validTransitions[from]?.includes(to) ?? false;
  }

  transition(from: GameState, to: GameState): GameState {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái ván đấu từ ${from} sang ${to}`,
      );
    }
    return to;
  }

  isPlayable(state: GameState): boolean {
    return state === GameState.IN_PROGRESS || state === GameState.CHECK;
  }

  isTerminal(state: GameState): boolean {
    return state === GameState.FINISHED || state === GameState.ABORTED;
  }
}