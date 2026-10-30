import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { GameState, GameEndReason, GameSocketEvent } from './state-machine/game-state.enum';
import { GameStateService } from './state-machine/game-state.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';

export interface BoardPosition {
  row: number;
  col: number;
}

export interface ActiveGameSession {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string | null;
  mode: 'PVP' | 'BOT';
  state: GameState;
  turn: 'w' | 'b';
  board: string[][];
  fen: string;
  moves: Array<{
    from: BoardPosition;
    to: BoardPosition;
    playerId: string;
    promotion?: string;
    timestamp: number;
  }>;
  hp: {
    w: number;
    b: number;
  };
  winnerId?: string | null;
  endReason?: GameEndReason | null;
  createdAt: number;
  updatedAt: number;
  engine: ChessEngineGame;
}

interface QueuedPlayer {
  playerId: string;
  socket: { join: (room: string) => void; emit?: (event: string, payload: any) => void };
}

@Injectable()
export class GameService {
  private readonly games = new Map<string, ActiveGameSession>();
  private readonly matchmakingQueue: QueuedPlayer[] = [];

  constructor(
    private readonly stateMachine: GameStateService = new GameStateService(),
  ) {}

  /**
   * Ghép cặp người chơi và phát sự kiện match_found (Chuẩn hóa theo test CI & State Machine)
   */
  addToMatchmaking(playerId: string, client: any, server: any): ActiveGameSession | null {
    const existingIndex = this.matchmakingQueue.findIndex((p) => p.playerId === playerId);
    if (existingIndex !== -1) {
      this.matchmakingQueue[existingIndex].socket = client;
      return null;
    }

    this.matchmakingQueue.push({ playerId, socket: client });

    if (this.matchmakingQueue.length < 2) {
      return null;
    }

    const whitePlayer = this.matchmakingQueue.shift()!;
    const blackPlayer = this.matchmakingQueue.shift()!;

    const game = this.createGame({
      whitePlayerId: whitePlayer.playerId,
      blackPlayerId: blackPlayer.playerId,
      mode: 'PVP',
    });

    whitePlayer.socket?.join?.(game.id);
    blackPlayer.socket?.join?.(game.id);

    server?.to?.(game.id)?.emit(GameSocketEvent.MATCH_FOUND, {
      gameId: game.id,
      white: game.whitePlayerId,
      black: game.blackPlayerId,
      state: game.state,
      fen: game.fen,
    });

    return game;
  }

  /**
   * Xử lý nước đi qua Socket, kiểm tra State Machine, lượt đi và tính hợp lệ của quân cờ
   */
  handleMove(
    playerId: string,
    gameId: string,
    from: BoardPosition,
    to: BoardPosition,
    server?: any,
    promotion?: 'q' | 'r' | 'b' | 'n',
  ): { success: boolean; game?: ActiveGameSession; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (!this.stateMachine.isPlayable(game.state)) {
      server?.to?.(gameId)?.emit(GameSocketEvent.MOVE_REJECTED, {
        gameId,
        playerId,
        reason: `Invalid game state: ${game.state}`,
      });
      return { success: false, error: `Invalid game state: ${game.state}` };
    }

    const activePlayerId = game.turn === 'w' ? game.whitePlayerId : game.blackPlayerId;
    if (playerId !== activePlayerId) {
      server?.to?.(gameId)?.emit(GameSocketEvent.MOVE_REJECTED, {
        gameId,
        playerId,
        reason: 'Not your turn',
      });
      return { success: false, error: 'Not your turn' };
    }

    if (!this.isValidBoardMove(game.board, from, to, game.turn)) {
      server?.to?.(gameId)?.emit(GameSocketEvent.MOVE_REJECTED, {
        gameId,
        playerId,
        reason: 'Illegal move',
      });
      return { success: false, error: 'Illegal move' };
    }

    // Thực hiện di chuyển quân trên bàn cờ
    const movingPiece = game.board[from.row][from.col];
    const targetPiece = game.board[to.row][to.col];

    game.board[from.row][from.col] = '';
    if (
      movingPiece.toLowerCase() === 'p' &&
      (to.row === 0 || to.row === 7)
    ) {
      const promoChar = promotion || 'q';
      game.board[to.row][to.col] =
        game.turn === 'w' ? promoChar.toUpperCase() : promoChar.toLowerCase();
    } else {
      game.board[to.row][to.col] = movingPiece;
    }

    game.moves.push({
      from,
      to,
      playerId,
      promotion,
      timestamp: Date.now(),
    });

    // Đổi lượt và cập nhật chuỗi FEN
    game.turn = game.turn === 'w' ? 'b' : 'w';
    const fullMoveNumber = Math.floor(game.moves.length / 2) + 1;
    game.fen = this.boardToFen(game.board, game.turn, fullMoveNumber);
    game.updatedAt = Date.now();

    // Nếu ăn vua đối phương thì kết thúc ván đấu qua State Machine
    if (targetPiece && targetPiece.toLowerCase() === 'k') {
      this.finishGame(game.id, playerId, GameEndReason.CHECKMATE);
    } else if (game.state === GameState.CHECK) {
      game.state = this.stateMachine.transition(game.state, GameState.IN_PROGRESS);
    }

    const movePayload = {
      gameId: game.id,
      playerId,
      from,
      to,
      fen: game.fen,
      turn: game.turn,
      state: game.state,
    };

    server?.to?.(game.id)?.emit(GameSocketEvent.MOVE_MADE, movePayload);

    if (game.state === GameState.FINISHED) {
      server?.to?.(game.id)?.emit(GameSocketEvent.GAME_OVER, {
        gameId: game.id,
        winnerId: game.winnerId,
        reason: game.endReason,
        state: game.state,
      });
    }

    return { success: true, game };
  }

  /**
   * Tạo ván đấu mới (Khởi tạo State Machine)
   */
  createGame(dto: CreateGameDto | any = {}): ActiveGameSession {
    const gameId =
      dto?.id || `game_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const mode = dto?.mode || (dto?.blackPlayerId === 'BOT' ? 'BOT' : 'PVP');
    const hasBothPlayers = Boolean(
      dto?.whitePlayerId && (dto?.blackPlayerId || mode === 'BOT'),
    );

    let initialState = GameState.WAITING;
    if (hasBothPlayers) {
      initialState = this.stateMachine.transition(
        GameState.WAITING,
        GameState.STARTING,
      );
      initialState = this.stateMachine.transition(
        initialState,
        GameState.IN_PROGRESS,
      );
    }

    const board = this.createInitialBoard();
    const session: ActiveGameSession = {
      id: gameId,
      whitePlayerId: dto?.whitePlayerId || 'white',
      blackPlayerId: mode === 'BOT' ? 'BOT' : (dto?.blackPlayerId ?? null),
      mode,
      state: initialState,
      turn: 'w',
      board,
      fen: this.boardToFen(board, 'w', 1),
      moves: [],
      hp: { w: 100, b: 100 },
      winnerId: null,
      endReason: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.games.set(gameId, session);
    return session;
  }

  joinGame(gameId: string, playerId: string): ActiveGameSession {
    const game = this.getGameOrThrow(gameId);

    if (!game.blackPlayerId && game.whitePlayerId !== playerId) {
      game.blackPlayerId = playerId;
    }

    if (
      game.state === GameState.WAITING &&
      game.whitePlayerId &&
      game.blackPlayerId
    ) {
      game.state = this.stateMachine.transition(
        game.state,
        GameState.IN_PROGRESS,
      );
      game.updatedAt = Date.now();
    }

    return game;
  }

  makeMove(dto: MoveDto | any, server?: any): ActiveGameSession {
    const gameId = dto?.gameId || dto?.id;
    const game = this.getGameOrThrow(gameId);
    const from = this.normalizePosition(dto.from);
    const to = this.normalizePosition(dto.to);
    const playerId =
      dto?.playerId ||
      (game.turn === 'w' ? game.whitePlayerId : game.blackPlayerId || 'black');

    const result = this.handleMove(
      playerId,
      gameId,
      from,
      to,
      server,
      dto?.promotion,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.game!;
  }

  finishGame(
    gameId: string,
    winnerId: string | null,
    reason: GameEndReason = GameEndReason.CHECKMATE,
  ): ActiveGameSession {
    const game = this.getGameOrThrow(gameId);
    if (!this.stateMachine.isTerminal(game.state)) {
      game.state = this.stateMachine.transition(
        game.state,
        GameState.FINISHED,
      );
      game.winnerId = winnerId;
      game.endReason = reason;
      game.updatedAt = Date.now();
    }
    return game;
  }

  resignGame(gameId: string, resigningPlayerId: string): ActiveGameSession {
    const game = this.getGameOrThrow(gameId);
    const winnerId =
      resigningPlayerId === game.whitePlayerId
        ? game.blackPlayerId
        : game.whitePlayerId;
    return this.finishGame(gameId, winnerId ?? null, GameEndReason.RESIGNATION);
  }

  getGame(gameId: string): ActiveGameSession | undefined {
    return this.games.get(gameId);
  }

  getGameOrThrow(gameId: string): ActiveGameSession {
    const game = this.games.get(gameId);
    if (!game) {
      throw new NotFoundException(`Game not found: ${gameId}`);
    }
    return game;
  }

  private normalizePosition(pos: string | BoardPosition): BoardPosition {
    if (typeof pos === 'object' && pos !== null) {
      return { row: Number(pos.row), col: Number(pos.col) };
    }
    const clean = String(pos).trim().toLowerCase();
    const col = clean.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(clean[1], 10);
    return { row: 8 - rank, col };
  }

  private isValidBoardMove(
    board: string[][],
    from: BoardPosition,
    to: BoardPosition,
    turn: 'w' | 'b',
  ): boolean {
    if (
      !from ||
      !to ||
      from.row < 0 ||
      from.row > 7 ||
      from.col < 0 ||
      from.col > 7 ||
      to.row < 0 ||
      to.row > 7 ||
      to.col < 0 ||
      to.col > 7
    ) {
      return false;
    }

    if (from.row === to.row && from.col === to.col) {
      return false;
    }

    const piece = board[from.row]?.[from.col];
    if (!piece) {
      return false;
    }
    return finished;
  }

    const isWhitePiece = piece === piece.toUpperCase();
    if ((turn === 'w' && !isWhitePiece) || (turn === 'b' && isWhitePiece)) {
      return false;
    }

    const target = board[to.row]?.[to.col];
    if (target) {
      const isWhiteTarget = target === target.toUpperCase();
      if (isWhitePiece === isWhiteTarget) {
        return false;
      }
    }

    const dr = to.row - from.row;
    const dc = to.col - from.col;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);
    const type = piece.toLowerCase();

    switch (type) {
      case 'p': {
        const dir = isWhitePiece ? -1 : 1;
        const startRow = isWhitePiece ? 6 : 1;
        if (dc === 0 && dr === dir && !target) {
          return true;
        }
        if (
          dc === 0 &&
          from.row === startRow &&
          dr === 2 * dir &&
          !target &&
          !board[from.row + dir][from.col]
        ) {
          return true;
        }
        if (absDc === 1 && dr === dir && Boolean(target)) {
          return true;
        }
        return false;
      }
      case 'n':
        return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
      case 'b':
        return absDr === absDc && this.isPathClear(board, from, to);
      case 'r':
        return (dr === 0 || dc === 0) && this.isPathClear(board, from, to);
      case 'q':
        return (
          (dr === 0 || dc === 0 || absDr === absDc) &&
          this.isPathClear(board, from, to)
        );
      case 'k':
        return absDr <= 1 && absDc <= 1;
      default:
        return false;
    }

    return false;
  }

  private isPathClear(
    board: string[][],
    from: BoardPosition,
    to: BoardPosition,
  ): boolean {
    const stepRow = Math.sign(to.row - from.row);
    const stepCol = Math.sign(to.col - from.col);
    let r = from.row + stepRow;
    let c = from.col + stepCol;

    while (r !== to.row || c !== to.col) {
      if (board[r][c]) {
        return false;
      }
      r += stepRow;
      c += stepCol;
    }
    return true;
  }

  private boardToFen(
    board: string[][],
    turn: 'w' | 'b',
    fullMoveNumber = 1,
  ): string {
    const rows = board.map((row) => {
      let empty = 0;
      let str = '';
      for (const cell of row) {
        if (!cell) {
          empty++;
        } else {
          if (empty > 0) {
            str += empty;
            empty = 0;
          }
          str += cell;
        }
      }
      if (empty > 0) {
        str += empty;
      }
      return str;
    });

    return `${rows.join('/')} ${turn} KQkq - 0 ${fullMoveNumber}`;
  }

  private createInitialBoard(): string[][] {
    return [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ];
  }

  private queuePersistence(game: ActiveGameSession): void {
    if (
      !this.supabase?.gamePersistenceConfigured ||
      game.mode !== 'PVP' ||
      !game.blackPlayerId ||
      !this.isUuid(game.whitePlayerId) ||
      !this.isUuid(game.blackPlayerId)
    ) {
      return;
    }

    const winner: PersistedMatchSnapshot['winner'] = game.winnerId === game.whitePlayerId
      ? 'w'
      : game.winnerId === game.blackPlayerId
        ? 'b'
        : game.state === GameState.FINISHED ? 'draw' : null;
    const snapshot: PersistedMatchSnapshot = {
      id: game.id,
      state: game.state,
      fen: this.boardToFen(game),
      moveHistory: game.moves.map(move => ({
        color: move.playerId === game.whitePlayerId ? 'w' : 'b',
        from: move.from,
        to: move.to,
        piece: move.piece || 'unknown',
        captured: move.captured,
        promotion: move.promotion,
      })),
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
      whiteTimeMs: game.timers.whiteRemainingMs,
      blackTimeMs: game.timers.blackRemainingMs,
      winner,
      endReason: game.endReason,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    const previous = this.persistenceQueue.get(game.id) ?? Promise.resolve();
    const pending = previous
      .catch(() => undefined)
      .then(() => this.supabase!.persistMatch(snapshot));
    this.persistenceQueue.set(game.id, pending);
    void pending.catch(error => {
      this.logger.error(`Không lưu được ván ${game.id}: ${error.message}`);
    });
  }

  private boardToFen(game: ActiveGameSession): string {
    const symbols: Record<string, string> = {
      pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k',
      p: 'p', n: 'n', b: 'b', r: 'r', q: 'q', k: 'k',
    };
    const rows = Array.from({ length: 8 }, (_, row) => {
      let empty = 0;
      let encoded = '';
      for (let col = 0; col < 8; col += 1) {
        const cell = parseCell(game.board?.[row]?.[col]);
        if (!cell) {
          empty += 1;
          continue;
        }
        if (empty) {
          encoded += String(empty);
          empty = 0;
        }
        const symbol = symbols[cell.type] || 'p';
        encoded += cell.color === 'w' ? symbol.toUpperCase() : symbol;
      }
      if (empty) encoded += String(empty);
      return encoded || '8';
    });
    return `${rows.join('/')} ${game.turn} - - 0 ${Math.floor(game.moves.length / 2) + 1}`;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
