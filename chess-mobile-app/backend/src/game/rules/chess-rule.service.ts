import { Injectable, BadRequestException } from '@nestjs/common';
import { ChessGame } from '../engine/game';
import { BoardPosition, PieceType } from '../engine/types';

const PROMOTION_MAP: Record<string, PieceType> = {
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
};

@Injectable()
export class ChessRuleService {
  private games = new Map<string, ChessGame>();

  // 'e2' -> { row: 6, col: 4 }
  private toPosition(square: string): BoardPosition {
    if (!/^[a-h][1-8]$/.test(square)) {
      throw new BadRequestException(`Ô cờ không hợp lệ: ${square}`);
    }
    return {
      col: square.charCodeAt(0) - 'a'.charCodeAt(0),
      row: 8 - parseInt(square[1], 10),
    };
  }

  private getGame(matchId: string): ChessGame {
    let game = this.games.get(matchId);
    if (!game) {
      game = new ChessGame();
      this.games.set(matchId, game);
    }
    return game;
  }

  // Kiểm tra luật và áp dụng nước đi. Sai luật thì ném lỗi.
  validateAndApply(matchId: string, from: string, to: string, promotion?: string) {
    const game = this.getGame(matchId);
    const promo = promotion ? PROMOTION_MAP[promotion.toLowerCase()] : undefined;
    const ok = game.makeMove(this.toPosition(from), this.toPosition(to), promo);
    if (!ok) {
      throw new BadRequestException('Nước đi không hợp lệ');
    }
    return { turn: game.getCurrentTurn() };
  }

  isGameOver(matchId: string): boolean {
    return this.getGame(matchId).isGameOver();
  }

  removeGame(matchId: string) {
    this.games.delete(matchId);
  }
}