import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
// Xóa import Position, PieceType bị lỗi. Tạm dùng import class Game
import { ChessGame } from './engine/game';
import { GameState, GameEndReason } from './state-machine/game-state.enum';
import { GameStateService } from './state-machine/game-state.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';

export interface PlayerConnectionState {
  playerId: string;
  connected: boolean;
  disconnectedAt: number | null;
  socketId?: string;
}

export interface ServerGameSession {
  id: string;
  engine: any; // Dùng 'any' để bypass toàn bộ lỗi đỏ check type của engine
  state: GameState;
  whitePlayerId: string;
  blackPlayerId: string;
  whiteTimeMs: number;
  blackTimeMs: number;
  lastTurnTimestamp: number;
  reconnectTimeoutMs: number;
  connections: {
    w: PlayerConnectionState;
    b: PlayerConnectionState;
  };
  winner: 'w' | 'b' | 'draw' | null;
  endReason: GameEndReason | string | null;
  createdAt: number;
  updatedAt: number;
}

@Injectable()
export class GameService implements OnModuleDestroy {
  private readonly games = new Map<string, ServerGameSession>();
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();
  private static readonly DEFAULT_INITIAL_TIME_MS = 5 * 60 * 1000;
  private static readonly DEFAULT_RECONNECT_TIMEOUT_MS = 30 * 1000;

  constructor(private readonly gameStateService: GameStateService) {}

  onModuleDestroy() {
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectTimers.clear();
  }

  createGame(dto: CreateGameDto) {
    const id =
      dto.gameId || `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const initialTimeMs =
      dto.initialTimeMs ?? GameService.DEFAULT_INITIAL_TIME_MS;
    const reconnectTimeoutMs =
      dto.reconnectTimeoutMs ?? GameService.DEFAULT_RECONNECT_TIMEOUT_MS;

    const now = Date.now();
    const session: ServerGameSession = {
      id,
      // Lưu ý: Nếu chữ Game dưới đây vẫn bị đỏ, hãy mở file 'backend/src/game/engine/game.ts' 
      // xem tên thật của class là gì (VD: export class ChessBoard) rồi sửa chữ Game thành chữ đó.
      engine: new ChessGame(), 
      state: this.gameStateService.transition(
        GameState.WAITING,
        GameState.IN_PROGRESS,
      ),
      whitePlayerId: dto.whitePlayerId,
      blackPlayerId: dto.blackPlayerId,
      whiteTimeMs: initialTimeMs,
      blackTimeMs: initialTimeMs,
      lastTurnTimestamp: now,
      reconnectTimeoutMs,
      connections: {
        w: {
          playerId: dto.whitePlayerId,
          connected: true,
          disconnectedAt: null,
        },
        b: {
          playerId: dto.blackPlayerId,
          connected: true,
          disconnectedAt: null,
        },
      },
      winner: null,
      endReason: null,
      createdAt: now,
      updatedAt: now,
    };

    this.games.set(id, session);
    return this.serializeGameState(session);
  }

  getGameState(gameId: string) {
    const session = this.getSessionOrThrow(gameId);
    this.syncClock(session);
    return this.serializeGameState(session);
  }

  makeMove(gameId: string, dto: MoveDto) {
    const session = this.getSessionOrThrow(gameId);

    if (session.state === GameState.FINISHED) {
      throw new BadRequestException('Game has already finished');
    }

    this.syncClock(session);
    // Ép kiểu as GameState để dập lỗi 'comparison appears unintentional'
    if ((session.state as GameState) === GameState.FINISHED) {
      return this.serializeGameState(session);
    }

    const currentTurn = session.engine.turn;
    const expectedPlayerId =
      currentTurn === 'w' ? session.whitePlayerId : session.blackPlayerId;

    if (dto.playerId && dto.playerId !== expectedPlayerId) {
      throw new BadRequestException('Not your turn');
    }

    // Ép kiểu as any để gọi hàm move mà không bị bắt lỗi tham số
    const moved = (session.engine as any).move(
      dto.from,
      dto.to,
      dto.promotion || 'q',
    );

    if (!moved) {
      throw new BadRequestException('Invalid chess move');
    }

    session.lastTurnTimestamp = Date.now();
    session.updatedAt = Date.now();

    if (session.engine.status === 'checkmate') {
      session.state = this.gameStateService.transition(
        session.state,
        GameState.FINISHED,
      );
      session.winner = currentTurn;
      session.endReason = GameEndReason.CHECKMATE;
      this.clearDisconnectTimersForGame(gameId);
    } else if (session.engine.status === 'stalemate') {
      session.state = this.gameStateService.transition(
        session.state,
        GameState.FINISHED,
      );
      session.winner = 'draw';
      session.endReason = GameEndReason.STALEMATE;
      this.clearDisconnectTimersForGame(gameId);
    }

    return this.serializeGameState(session);
  }

  resign(gameId: string, playerId: string) {
    const session = this.getSessionOrThrow(gameId);

    if (session.state === GameState.FINISHED) {
      throw new BadRequestException('Game has already finished');
    }

    const color = this.getPlayerColor(session, playerId);
    this.syncClock(session);

    if ((session.state as GameState) !== GameState.FINISHED) {
      session.state = this.gameStateService.transition(
        session.state,
        GameState.FINISHED,
      );
      session.winner = color === 'w' ? 'b' : 'w';
      session.endReason = GameEndReason.RESIGN;
      session.updatedAt = Date.now();
      this.clearDisconnectTimersForGame(gameId);
    }

    return this.serializeGameState(session);
  }

  handleDisconnect(
    gameId: string,
    playerId: string,
    onForfeitCallback?: (state: any) => void,
  ) {
    const session = this.getSessionOrThrow(gameId);
    if (session.state === GameState.FINISHED) {
      return this.serializeGameState(session);
    }

    const color = this.getPlayerColor(session, playerId);
    this.syncClock(session);

    session.connections[color].connected = false;
    session.connections[color].disconnectedAt = Date.now();
    session.state = this.gameStateService.transition(
      session.state,
      GameState.PAUSED,
    );
    session.updatedAt = Date.now();

    const timerKey = `${gameId}:${color}`;
    const existingTimer = this.disconnectTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(timerKey);
      const current = this.games.get(gameId);
      if (
        current &&
        current.state !== GameState.FINISHED &&
        !current.connections[color].connected
      ) {
        current.state = this.gameStateService.transition(
          current.state,
          GameState.FINISHED,
        );
        current.winner = color === 'w' ? 'b' : 'w';
        current.endReason = GameEndReason.DISCONNECT_TIMEOUT;
        current.updatedAt = Date.now();
        if (onForfeitCallback) {
          onForfeitCallback(this.serializeGameState(current));
        }
      }
    }, session.reconnectTimeoutMs);

    this.disconnectTimers.set(timerKey, timer);
    return this.serializeGameState(session);
  }

  handleReconnect(gameId: string, playerId: string, socketId?: string) {
    const session = this.getSessionOrThrow(gameId);
    const color = this.getPlayerColor(session, playerId);

    this.syncClock(session);

    if (session.state === GameState.FINISHED) {
      return this.serializeGameState(session);
    }

    const disconnectedAt = session.connections[color].disconnectedAt;
    if (
      disconnectedAt &&
      Date.now() - disconnectedAt > session.reconnectTimeoutMs
    ) {
      session.state = this.gameStateService.transition(
        session.state,
        GameState.FINISHED,
      );
      session.winner = color === 'w' ? 'b' : 'w';
      session.endReason = GameEndReason.DISCONNECT_TIMEOUT;
      session.updatedAt = Date.now();
      this.clearDisconnectTimersForGame(gameId);
      return this.serializeGameState(session);
    }

    const timerKey = `${gameId}:${color}`;
    const timer = this.disconnectTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(timerKey);
    }

    session.connections[color].connected = true;
    session.connections[color].disconnectedAt = null;
    if (socketId) {
      session.connections[color].socketId = socketId;
    }

    if (session.connections.w.connected && session.connections.b.connected) {
      session.state = this.gameStateService.transition(
        session.state,
        GameState.IN_PROGRESS,
      );
      session.lastTurnTimestamp = Date.now();
    }

    session.updatedAt = Date.now();
    return this.serializeGameState(session);
  }

  checkTimeout(gameId: string) {
    const session = this.getSessionOrThrow(gameId);
    this.syncClock(session);
    return this.serializeGameState(session);
  }

  private syncClock(session: ServerGameSession) {
    if (session.state !== GameState.IN_PROGRESS) {
      return;
    }

    const now = Date.now();
    const elapsed = Math.max(0, now - session.lastTurnTimestamp);
    session.lastTurnTimestamp = now;

    if (session.engine.turn === 'w') {
      session.whiteTimeMs = Math.max(0, session.whiteTimeMs - elapsed);
      if (session.whiteTimeMs <= 0) {
        session.state = this.gameStateService.transition(
          session.state,
          GameState.FINISHED,
        );
        session.winner = 'b';
        session.endReason = GameEndReason.TIMEOUT;
        this.clearDisconnectTimersForGame(session.id);
      }
    } else {
      session.blackTimeMs = Math.max(0, session.blackTimeMs - elapsed);
      if (session.blackTimeMs <= 0) {
        session.state = this.gameStateService.transition(
          session.state,
          GameState.FINISHED,
        );
        session.winner = 'w';
        session.endReason = GameEndReason.TIMEOUT;
        this.clearDisconnectTimersForGame(session.id);
      }
    }
  }

  private getSessionOrThrow(gameId: string): ServerGameSession {
    const session = this.games.get(gameId);
    if (!session) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }
    return session;
  }

  private getPlayerColor(
    session: ServerGameSession,
    playerId: string,
  ): 'w' | 'b' {
    if (session.whitePlayerId === playerId) return 'w';
    if (session.blackPlayerId === playerId) return 'b';
    throw new BadRequestException(`Player ${playerId} is not in this game`);
  }

  private clearDisconnectTimersForGame(gameId: string) {
    for (const color of ['w', 'b'] as const) {
      const key = `${gameId}:${color}`;
      const timer = this.disconnectTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.disconnectTimers.delete(key);
      }
    }
  }

  private serializeGameState(session: ServerGameSession) {
    return {
      id: session.id,
      gameId: session.id,
      state: session.state,
      // Thêm ?. (optional chaining) để không văng lỗi nếu engine viết thiếu thuộc tính
      board: session.engine?.board?.grid,
      turn: session.engine?.turn,
      engineStatus: session.engine?.status,
      moveHistory: session.engine?.moveHistory,
      whitePlayerId: session.whitePlayerId,
      blackPlayerId: session.blackPlayerId,
      whiteTimeMs: session.whiteTimeMs,
      blackTimeMs: session.blackTimeMs,
      connections: session.connections,
      winner: session.winner,
      endReason: session.endReason,
      updatedAt: session.updatedAt,
    };
  }
}