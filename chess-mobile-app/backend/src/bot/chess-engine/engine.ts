import { BotDifficulty, normalizeBotDifficulty } from '../bot-difficulty.enum';
import {
  generateLegalMoves,
  GeneratedMove,
} from './move-generator';
import { findBestMoveMinimax } from './minimax';

export class BotChessEngine {
  /**
   * Chọn nước đi cho Bot dựa theo độ khó EASY hoặc MEDIUM
   */
  public selectMove(
    board: any[][],
    botColor: 'w' | 'b',
    difficulty: BotDifficulty | string = BotDifficulty.EASY,
    validatorFn?: (move: GeneratedMove) => boolean,
  ): GeneratedMove | null {
    const normalized = normalizeBotDifficulty(String(difficulty));
    const legalMoves = generateLegalMoves(board, botColor, validatorFn);

    if (legalMoves.length === 0) {
      return null;
    }

    // Mức EASY: chọn ngẫu nhiên trong các nước đi hợp lệ
    if (normalized === BotDifficulty.EASY) {
      const randomIndex = Math.floor(Math.random() * legalMoves.length);
      return legalMoves[randomIndex];
    }

    // Mức MEDIUM (hoặc HARD): dùng Minimax + Alpha-Beta Pruning
    const depth = normalized === BotDifficulty.HARD ? 3 : 2;
    return (
      findBestMoveMinimax(board, botColor, depth, validatorFn) || legalMoves[0]
    );
  }
}