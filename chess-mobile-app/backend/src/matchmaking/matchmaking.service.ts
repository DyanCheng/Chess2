// chess-mobile-app/backend/src/matchmaking/matchmaking.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { MatchmakingQueue, QueuePlayer } from './queue/matchmaking.queue';
import { GameService } from '../game/game.service';

export interface MatchResult {
  gameId: string;
  whitePlayer: QueuePlayer;
  blackPlayer: QueuePlayer;
  gameState: any;
}

@Injectable()
export class MatchmakingService {
  constructor(
    private readonly matchmakingQueue: MatchmakingQueue,
    private readonly gameService: GameService,
  ) {}

  /**
   * Người chơi tham gia hàng đợi và thử ghép cặp ngay lập tức
   */
  joinQueue(
    playerId: string,
    rating = 1000,
    socketId?: string,
  ): { status: 'QUEUED' | 'MATCHED'; match?: MatchResult; queueSize: number } {
    if (!playerId || !playerId.trim()) {
      throw new BadRequestException('playerId is required');
    }

    this.matchmakingQueue.enqueue(playerId, rating, socketId);
    const match = this.tryMatch();

    if (match) {
      return {
        status: 'MATCHED',
        match,
        queueSize: this.matchmakingQueue.size(),
      };
    }

    return {
      status: 'QUEUED',
      queueSize: this.matchmakingQueue.size(),
    };
  }

  /**
   * Người chơi rời hàng đợi tìm trận
   */
  leaveQueue(playerId: string): { removed: boolean; queueSize: number } {
    const removed = this.matchmakingQueue.dequeue(playerId);
    return {
      removed,
      queueSize: this.matchmakingQueue.size(),
    };
  }

  /**
   * Xử lý khi socket ngắt kết nối trong lúc đang tìm trận
   */
  handleSocketDisconnect(socketId: string): QueuePlayer | undefined {
    return this.matchmakingQueue.removeBySocketId(socketId);
  }

  /**
   * Kiểm tra và ghép 2 người chơi trong hàng đợi, tạo ván đấu mới trên Server
   */
  tryMatch(): MatchResult | null {
    const pair = this.matchmakingQueue.popMatchPair();
    if (!pair) {
      return null;
    }

    const [p1, p2] = pair;
    // Phân định Trắng / Đen
    const whitePlayer = p1;
    const blackPlayer = p2;

    // Tạo game trên Server (Server là nguồn state duy nhất)
    const createdGame = this.gameService.createGame({
      whitePlayerId: whitePlayer.playerId,
      blackPlayerId: blackPlayer.playerId,
    });

    const gameId = createdGame.id ?? createdGame.gameId;

    return {
      gameId,
      whitePlayer,
      blackPlayer,
      gameState: createdGame,
    };
  }

  getQueueStatus(playerId: string) {
    return {
      inQueue: this.matchmakingQueue.isQueued(playerId),
      queueSize: this.matchmakingQueue.size(),
    };
  }
}