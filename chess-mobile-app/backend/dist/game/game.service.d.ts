import { GameState, GameEndReason } from './state-machine/game-state.enum';
import { GameStateService } from './state-machine/game-state.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';
export interface BoardPosition {
    row: number;
    col: number;
}
export interface ActiveGameSession {
    id: string;
    whitePlayerId: string;
    blackPlayerId: string | null;
    mode: 'PVP' | 'BOT';
    state: GameState;
    turn: 'w' | 'b';
    board: string[][];
    fen: string;
    moves: Array<{
        from: BoardPosition;
        to: BoardPosition;
        playerId: string;
        promotion?: string;
        timestamp: number;
    }>;
    hp: {
        w: number;
        b: number;
    };
    winnerId?: string | null;
    endReason?: GameEndReason | null;
    createdAt: number;
    updatedAt: number;
}
export declare class GameService {
    private readonly stateMachine;
    private readonly games;
    private readonly matchmakingQueue;
    constructor(stateMachine?: GameStateService);
    addToMatchmaking(playerId: string, client: any, server: any): ActiveGameSession | null;
    handleMove(playerId: string, gameId: string, from: BoardPosition, to: BoardPosition, server?: any, promotion?: 'q' | 'r' | 'b' | 'n'): {
        success: boolean;
        game?: ActiveGameSession;
        error?: string;
    };
    createGame(dto?: CreateGameDto | any): ActiveGameSession;
    joinGame(gameId: string, playerId: string): ActiveGameSession;
    makeMove(dto: MoveDto | any, server?: any): ActiveGameSession;
    finishGame(gameId: string, winnerId: string | null, reason?: GameEndReason): ActiveGameSession;
    resignGame(gameId: string, resigningPlayerId: string): ActiveGameSession;
    getGame(gameId: string): ActiveGameSession | undefined;
    getGameOrThrow(gameId: string): ActiveGameSession;
    private normalizePosition;
    private isValidBoardMove;
    private isPathClear;
    private boardToFen;
    private createInitialBoard;
}
