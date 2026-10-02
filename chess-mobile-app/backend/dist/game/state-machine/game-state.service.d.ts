import { GameState } from './game-state.enum';
export declare class GameStateService {
    canTransition(currentState: GameState, nextState: GameState): boolean;
    updateBoardState(currentFen: string, move: string): string;
}
