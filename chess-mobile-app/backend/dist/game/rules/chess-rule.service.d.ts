import { Chess } from 'chess.js';
export declare class ChessRuleService {
    private games;
    getGame(matchId: string, fen?: string): Chess;
    validateAndApply(matchId: string, from: string, to: string, promotion?: string): {
        success: boolean;
        move: {
            from: import("chess.js").Square;
            to: import("chess.js").Square;
            piece: import("chess.js").PieceSymbol;
            captured: import("chess.js").PieceSymbol;
            promotion: import("chess.js").PieceSymbol;
            isCastling: boolean;
            isEnPassant: boolean;
        };
        fen: string;
        turn: import("chess.js").Color;
        status: string;
        reason: any;
        isGameOver: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        move?: undefined;
        fen?: undefined;
        turn?: undefined;
        status?: undefined;
        reason?: undefined;
        isGameOver?: undefined;
    };
    getSerializedState(matchId: string): string;
    restoreState(matchId: string, fen: string): boolean;
}
