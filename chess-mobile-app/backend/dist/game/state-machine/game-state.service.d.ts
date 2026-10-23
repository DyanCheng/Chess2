import { GameState } from './game-state.enum';
export declare class GameStateService {
    private readonly validTransitions;
    canTransition(from: GameState, to: GameState): boolean;
    transition(from: GameState, to: GameState): GameState;
    isPlayable(state: GameState): boolean;
    isTerminal(state: GameState): boolean;
}
