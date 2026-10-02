import { Injectable, BadRequestException } from '@nestjs/common';
import { GameState } from './game-state.enum';

@Injectable()
export class GameStateService {
  // BE-012: Match state machine - Chuyển đổi trạng thái hợp lệ
  canTransition(currentState: GameState, nextState: GameState): boolean {
    switch (currentState) {
      case GameState.WAITING:
        return [GameState.IN_PROGRESS, GameState.CANCELLED].includes(nextState);
      case GameState.IN_PROGRESS:
        return [GameState.FINISHED, GameState.CANCELLED].includes(nextState);
      default:
        return false;
    }
  }

  // BE-011: Game state service - Cập nhật FEN
  updateBoardState(currentFen: string, move: string): string {
    // Tích hợp logic chess.js hoặc chess-engine tùy custom để tạo FEN mới
    // Trả về chuỗi FEN sau khi nước đi hợp lệ được thực hiện
    return 'new-fen-string-after-move'; 
  }
}