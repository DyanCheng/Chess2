import { Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';

export type ChessMoveResult =
  | { success: false; message: string }
  | {
      success: true;
      move: {
        from: string;
        to: string;
        piece: string;
        captured?: string;
        promotion?: string;
        isCastling: boolean;
        isEnPassant: boolean;
      };
      fen: string;
      turn: 'w' | 'b';
      status: 'IN_PROGRESS' | 'CHECKMATE' | 'DRAW';
      reason: string | null;
      isCheck: boolean;
      isGameOver: boolean;
    };

/**
 * Owns the authoritative chess.js instance for each active game.  Keeping the
 * rules here prevents the REST controller and the socket gateway from
 * applying subtly different move validation.
 */
@Injectable()
export class ChessRuleService {
  private readonly games = new Map<string, Chess>();

  getGame(gameId: string, fen?: string): Chess {
    if (!this.games.has(gameId)) {
      this.games.set(gameId, new Chess(fen));
    }
    return this.games.get(gameId)!;
  }

  validateAndApply(
    gameId: string,
    from: string,
    to: string,
    promotion?: 'q' | 'r' | 'b' | 'n',
  ): ChessMoveResult {
    const game = this.getGame(gameId);

    try {
      const move = game.move({ from, to, promotion });
      if (!move) {
        return { success: false, message: 'Invalid chess move' };
      }

      let status: 'IN_PROGRESS' | 'CHECKMATE' | 'DRAW' = 'IN_PROGRESS';
      let reason: string | null = null;
      if (game.isCheckmate()) {
        status = 'CHECKMATE';
      } else if (game.isStalemate()) {
        status = 'DRAW';
        reason = 'STALEMATE';
      } else if (game.isInsufficientMaterial()) {
        status = 'DRAW';
        reason = 'INSUFFICIENT_MATERIAL';
      } else if (game.isDrawByFiftyMoves()) {
        status = 'DRAW';
        reason = 'FIFTY_MOVE_RULE';
      } else if (game.isThreefoldRepetition()) {
        status = 'DRAW';
        reason = 'THREEFOLD_REPETITION';
      }

      return {
        success: true,
        move: {
          from: move.from,
          to: move.to,
          piece: move.piece,
          captured: move.captured,
          promotion: move.promotion,
          isCastling: move.flags.includes('k') || move.flags.includes('q'),
          isEnPassant: move.flags.includes('e'),
        },
        fen: game.fen(),
        turn: game.turn(),
        status,
        reason,
        isCheck: game.isCheck(),
        isGameOver: game.isGameOver(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Invalid chess move',
      };
    }
  }

  getSerializedState(gameId: string): string {
    return this.getGame(gameId).fen();
  }

  restoreState(gameId: string, fen: string): boolean {
    try {
      this.games.set(gameId, new Chess(fen));
      return true;
    } catch {
      return false;
    }
  }
}
