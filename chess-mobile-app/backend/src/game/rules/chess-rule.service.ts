import { Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';

@Injectable()
export class ChessRuleService {
  private games: Map<string, Chess> = new Map();

  // Khởi tạo hoặc lấy game instance theo matchId
  getGame(matchId: string, fen?: string): Chess {
    if (!this.games.has(matchId)) {
      this.games.set(matchId, new Chess(fen));
    }
    return this.games.get(matchId)!;
  }

  // Thực hiện nước đi và kiểm tra toàn bộ luật chơi (GAME-008 đến GAME-014)
  validateAndApply(matchId: string, from: string, to: string, promotion?: string) {
    const game = this.getGame(matchId);
    
    try {
      // chess.js tự động xử lý Castling, En passant, Promotion từ đối tượng move
      const moveResult = game.move({
        from,
        to,
        promotion: promotion ? promotion.toLowerCase() : 'q',
      });

      if (!moveResult) {
        return { success: false, message: 'Nước đi không hợp lệ' };
      }

      // Kiểm tra trạng thái ván đấu và các điều kiện kết thúc / hòa
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
          // Kiểm tra các cờ đặc biệt do chess.js hỗ trợ sẵn
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

  // Hỗ trợ lưu / khôi phục trạng thái (GAME-015)
  getSerializedState(matchId: string): string {
    const game = this.getGame(matchId);
    return game.fen();
  }

  restoreState(matchId: string, fen: string): boolean {
    const game = new Chess();
    const success = game.load(fen);
    if (success) {
      this.games.set(matchId, game);
      return true;
    }
    return false;
  }
}