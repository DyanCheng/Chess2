// chess-mobile-app/backend/src/matchmaking/queue/matchmaking.queue.ts
import { Injectable } from '@nestjs/common';

export interface QueuePlayer {
  playerId: string;
  socketId?: string;
  rating: number;
  joinedAt: number;
}

@Injectable()
export class MatchmakingQueue {
  private queue: Map<string, QueuePlayer> = new Map();

  /**
   * Thêm người chơi vào hàng đợi tìm trận
   */
  enqueue(playerId: string, rating = 1000, socketId?: string): QueuePlayer {
    const existing = this.queue.get(playerId);
    if (existing) {
      existing.socketId = socketId ?? existing.socketId;
      return existing;
    }

    const entry: QueuePlayer = {
      playerId,
      socketId,
      rating,
      joinedAt: Date.now(),
    };
    this.queue.set(playerId, entry);
    return entry;
  }

  /**
   * Xóa người chơi khỏi hàng đợi theo playerId
   */
  dequeue(playerId: string): boolean {
    return this.queue.delete(playerId);
  }

  /**
   * Xóa người chơi khỏi hàng đợi khi mất kết nối socket
   */
  removeBySocketId(socketId: string): QueuePlayer | undefined {
    for (const [playerId, player] of this.queue.entries()) {
      if (player.socketId === socketId) {
        this.queue.delete(playerId);
        return player;
      }
    }
    return undefined;
  }

  /**
   * Kiểm tra người chơi có đang trong hàng đợi không
   */
  isQueued(playerId: string): boolean {
    return this.queue.has(playerId);
  }

  /**
   * Lấy số lượng người chơi đang chờ
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Tìm cặp đấu phù hợp (ưu tiên chênh lệch rating <= maxRatingDiff, hoặc ghép FIFO nếu chờ lâu)
   */
  popMatchPair(maxRatingDiff = 400): [QueuePlayer, QueuePlayer] | null {
    if (this.queue.size < 2) {
      return null;
    }

    const players = Array.from(this.queue.values()).sort(
      (a, b) => a.joinedAt - b.joinedAt,
    );

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];
        const waitTimeMs = Date.now() - p1.joinedAt;
        // Mở rộng khoảng cách ELO theo thời gian chờ (mỗi 5s mở rộng thêm 100 điểm)
        const dynamicDiff = maxRatingDiff + Math.floor(waitTimeMs / 5000) * 100;

        if (Math.abs(p1.rating - p2.rating) <= dynamicDiff) {
          this.queue.delete(p1.playerId);
          this.queue.delete(p2.playerId);
          return [p1, p2];
        }
      }
    }

    // Nếu không ai nằm trong ngưỡng mặc định nhưng đã có >= 2 người, ghép 2 người chờ lâu nhất
    const [first, second] = players;
    this.queue.delete(first.playerId);
    this.queue.delete(second.playerId);
    return [first, second];
  }

  clear(): void {
    this.queue.clear();
  }
}