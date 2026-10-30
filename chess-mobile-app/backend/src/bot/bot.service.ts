import { Injectable } from '@nestjs/common';
import { BotDifficulty, normalizeBotDifficulty } from './bot-difficulty.enum';
import { BotChessEngine } from './chess-engine/engine';
import { GeneratedMove } from './chess-engine/move-generator';

@Injectable()
export class BotService {
  private readonly engine = new BotChessEngine();

  /**
   * Kiểm tra xem playerId có phải là Bot hay không
   */
  isBotPlayer(playerId?: string | null): boolean {
    if (!playerId) return false;
    const upper = playerId.toUpperCase();
    return (
      upper === 'BOT' ||
      upper.startsWith('BOT_') ||
      upper.startsWith('AI_')
    );
  }

  /**
   * Suy ra độ khó từ playerId hoặc cấu hình trận đấu
   */
  resolveDifficulty(
    botDifficulty?: string,
    botPlayerId?: string | null,
  ): BotDifficulty {
    if (botDifficulty) {
      return normalizeBotDifficulty(botDifficulty);
    }
    if (botPlayerId && botPlayerId.toUpperCase().includes('MEDIUM')) {
      return BotDifficulty.MEDIUM;
    }
    return BotDifficulty.EASY;
  }

  /**
   * Tính toán nước đi tiếp theo cho Bot
   */
  getNextMove(
    board: any[][],
    botColor: 'w' | 'b',
    difficulty: BotDifficulty | string = BotDifficulty.EASY,
    validatorFn?: (move: GeneratedMove) => boolean,
  ): GeneratedMove | null {
    return this.engine.selectMove(board, botColor, difficulty, validatorFn);
  }
}