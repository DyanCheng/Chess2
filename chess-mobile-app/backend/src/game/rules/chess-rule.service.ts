import { Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';

@Injectable()
export class ChessRuleService {
  private games: Map<string, Chess> = new Map();

  // Khá»Ÿi táº¡o hoáº·c láº¥y game instance theo matchId
  getGame(matchId: string, fen?: string): Chess {
    if (!this.games.has(matchId)) {
      this.games.set(matchId, new Chess(fen));
    }
    return this.games.get(matchId)!;
  }

  // Thá»±c hiá»‡n nÆ°á»›c Ä‘i vĂ  kiá»ƒm tra toĂ n bá»™ luáº­t chÆ¡i (GAME-008 Ä‘áº¿n GAME-014)
  validateAndApply(matchId: string, from: string, to: string, promotion?: string) {
    const game = this.getGame(matchId);
    
    try {
      // chess.js tá»± Ä‘á»™ng xá»­ lĂ½ Castling, En passant, Promotion tá»« Ä‘á»‘i tÆ°á»£ng move
      const moveResult = game.move({
        from,
        to,
        promotion: promotion ? promotion.toLowerCase() : 'q',
      });

      if (!moveResult) {
        return { success: false, message: 'NÆ°á»›c Ä‘i khĂ´ng há»£p lá»‡' };
      }

      // Kiá»ƒm tra tráº¡ng thĂ¡i vĂ¡n Ä‘áº¥u vĂ  cĂ¡c Ä‘iá»u kiá»‡n káº¿t thĂºc / hĂ²a
      let status = 'IN_PROGRESS';
      let reason = null;

      if (game.isCheckmate()) {
        status = 'CHECKMATE';
      } else if (game.isStalemate()) {
        status = 'DRAW';
        reason = 'STALEMATE'; // GAME-011
      } else if (game.isInsufficientMaterial()) {
        status = 'DRAW';
        reason = 'INSUFFICIENT_MATERIAL'; // GAME-012
      } else if (game.isDrawByFiftyMoves()) {
        status = 'DRAW';
        reason = 'FIFTY_MOVE_RULE'; // GAME-014
      } else if (game.isThreefoldRepetition()) {
        status = 'DRAW';
        reason = 'THREEFOLD_REPETITION'; // GAME-013
      } else if (game.isDraw()) {
        status = 'DRAW';
        reason = 'DRAW';
      }

      return {
        success: true,
        move: {
          from: moveResult.from,
          to: moveResult.to,
          piece: moveResult.piece,
          captured: moveResult.captured,
          promotion: moveResult.promotion,
          // Kiá»ƒm tra cĂ¡c cá» Ä‘áº·c biá»‡t do chess.js há»— trá»£ sáºµn
          isCastling: moveResult.san === 'O-O' || moveResult.san === 'O-O-O',
          isEnPassant: moveResult.flags.includes('e'),
        },
        fen: game.fen(),
        turn: game.turn(),
        status,
        reason,
        isGameOver: game.isGameOver(),
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Há»— trá»£ lÆ°u / khĂ´i phá»¥c tráº¡ng thĂ¡i (GAME-015)
  getSerializedState(matchId: string): string {
    const game = this.getGame(matchId);
    return game.fen();
  }

  restoreState(matchId: string, fen: string): boolean {
    try {
      const game = new Chess(fen);
      this.games.set(matchId, game);
      return true;
    } catch {
      return false;
    }
  }
}
