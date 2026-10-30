import { Injectable } from '@nestjs/common';
import {
  generateLegalMoves,
  isKingInCheckOnBoard,
  parseCell,
} from '../../bot/chess-engine/move-generator';
import { PlayerHpState } from '../hp/hp.service';

export interface MatchEndEvaluation {
  isEnded: boolean;
  isCheck: boolean;
  winnerId: string | null;
  reason: 'CHECKMATE' | 'DRAW' | 'STALEMATE' | 'HP' | null;
}

@Injectable()
export class CheckmateService {
  /**
   * Kiểm tra bàn cờ có rơi vào thế Hòa do không đủ quân chiếu bí (Insufficient Material)
   */
  isInsufficientMaterial(board: any[][]): boolean {
    if (!Array.isArray(board)) return false;
    const pieces: string[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = parseCell(board[r]?.[c]);
        if (p && p.type !== 'k') {
          pieces.push(p.type);
        }
      }
    }

    // Chỉ còn 2 Vua
    if (pieces.length === 0) return true;
    // Chỉ còn 2 Vua + 1 Mã hoặc 1 Tượng
    if (pieces.length === 1 && (pieces[0] === 'n' || pieces[0] === 'b')) {
      return true;
    }
    return false;
  }

  /**
   * Đánh giá kết thúc trận đấu sau mỗi nước đi:
   * 1. HP về 0 -> Kết thúc theo HP
   * 2. Không còn nước đi hợp lệ + Đang bị chiếu -> CHECKMATE
   * 3. Không còn nước đi hợp lệ + Không bị chiếu -> DRAW (Stalemate)
   * 4. Không đủ lực lượng chiếu bí hoặc lặp/quá số nước -> DRAW
   */
  evaluateMatchEnd(params: {
    board: any[][];
    nextTurn: 'w' | 'b';
    whitePlayerId: string;
    blackPlayerId: string | null;
    hp: PlayerHpState;
    movesCount?: number;
  }): MatchEndEvaluation {
    const { board, nextTurn, whitePlayerId, blackPlayerId, hp, movesCount = 0 } =
      params;

    // 1. Kiểm tra điều kiện kết thúc do HP trước
    if (hp.white <= 0 && hp.black <= 0) {
      return {
        isEnded: true,
        isCheck: false,
        winnerId: null,
        reason: 'DRAW',
      };
    }
    if (hp.black <= 0) {
      return {
        isEnded: true,
        isCheck: false,
        winnerId: whitePlayerId,
        reason: 'HP',
      };
    }
    if (hp.white <= 0) {
      return {
        isEnded: true,
        isCheck: false,
        winnerId: blackPlayerId,
        reason: 'HP',
      };
    }

    // 2. Kiểm tra trạng thái chiếu và số nước đi hợp lệ của phe chuẩn bị đi (nextTurn)
    const inCheck = isKingInCheckOnBoard(board, nextTurn);
    const legalMoves = generateLegalMoves(board, nextTurn);

    if (legalMoves.length === 0) {
      if (inCheck) {
        // Chiếu bí (Checkmate): phe vừa đi (ngược với nextTurn) giành chiến thắng
        const winnerId = nextTurn === 'w' ? blackPlayerId : whitePlayerId;
        return {
          isEnded: true,
          isCheck: true,
          winnerId,
          reason: 'CHECKMATE',
        };
      } else {
        // Hòa cờ do hết nước đi (Stalemate / Draw)
        return {
          isEnded: true,
          isCheck: false,
          winnerId: null,
          reason: 'DRAW',
        };
      }
    }

    // 3. Kiểm tra hòa cờ do không đủ quân (Insufficient Material) hoặc quá 100 nửa nước đi (50-move rule)
    if (this.isInsufficientMaterial(board) || movesCount >= 200) {
      return {
        isEnded: true,
        isCheck: inCheck,
        winnerId: null,
        reason: 'DRAW',
      };
    }

    return {
      isEnded: false,
      isCheck: inCheck,
      winnerId: null,
      reason: null,
    };
  }
}