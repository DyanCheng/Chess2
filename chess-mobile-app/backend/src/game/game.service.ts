import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';
import { GameEndReason, GameState } from './state-machine/game-state.enum';
import { GameStateService } from './state-machine/game-state.service';
import { ChessGame as ChessEngineGame } from './engine/game'; // Giữ nguyên import theo trường hợp 2 của bạn
import { ChessRuleService } from './rules/chess-rule.service';
import { BotService } from '../bot/bot.service';
import { BotDifficulty, normalizeBotDifficulty } from '../bot/bot-difficulty.enum';
import { HpService, PlayerHpState } from './hp/hp.service';
import { CheckmateService } from './rules/checkmate.service';
import {
  applyMoveOnBoard,
  parseCell,
  squareToCoords,
  coordsToSquare,
  generateLegalMoves,
} from '../bot/chess-engine/move-generator';

export interface ActiveGameSession {
  id: string;
  gameId?: string; // <-- Thêm dòng này để sửa lỗi build của matchmaking.service.ts
  whitePlayerId: string;
  blackPlayerId: string | null;
  mode: string;
  botDifficulty?: BotDifficulty;
  state: GameState;
  turn: 'w' | 'b';
  board: any;
  fen: string;
  moves: Array<{
    from: string;
    to: string;
    playerId: string;
    promotion?: string;
    captured?: string;
    timestamp: number;
  }>;
  hp: PlayerHpState;
  timers: {
    whiteRemainingMs: number;
    blackRemainingMs: number;
    lastTurnStartedAt: number | null;
  };
  disconnectedPlayers: Record<string, number>;
  reconnectTimeoutMs: number;
  winnerId: string | null;
  endReason: GameEndReason | string | null;
  createdAt: number;
  updatedAt: number;
  engine: ChessEngineGame;
}

@Injectable()
export class GameService {
  private readonly games = new Map<string, ActiveGameSession>();
  private readonly playerGameMap = new Map<string, string>();
  private readonly waitingQueue: Array<{ id: string; emit?: Function; join?: Function }> = [];

  private readonly stateService: GameStateService;
  private readonly chessRuleService: ChessRuleService;
  private readonly botService: BotService;
  private readonly hpService: HpService;
  private readonly checkmateService: CheckmateService;

  constructor(
    @Optional() stateService?: GameStateService,
    @Optional() chessRuleService?: ChessRuleService,
    @Optional() botService?: BotService,
    @Optional() hpService?: HpService,
    @Optional() checkmateService?: CheckmateService,
  ) {
    this.stateService = stateService || new GameStateService();
    this.chessRuleService = chessRuleService || new ChessRuleService();
    this.botService = botService || new BotService();
    this.hpService = hpService || new HpService();
    this.checkmateService = checkmateService || new CheckmateService();
  }

  createGame(dto: CreateGameDto): ActiveGameSession {
    const id = dto.gameId || `game_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const engine = new ChessEngineGame();
    const initialTimeMs = dto.initialTimeMs ?? 300_000;
    const reconnectTimeoutMs = dto.reconnectTimeoutMs ?? 30_000;
    const initialHp = dto.initialHp ?? 100;

    const rawMode = (dto.mode || '').toUpperCase();
    const isBotMode =
      rawMode === 'BOT' ||
      rawMode.startsWith('BOT_') ||
      Boolean(dto.botDifficulty) ||
      this.botService.isBotPlayer(dto.blackPlayerId);

    const botDifficulty = isBotMode
      ? this.botService.resolveDifficulty(
          dto.botDifficulty || (rawMode.includes('MEDIUM') ? 'MEDIUM' : 'EASY'),
          dto.blackPlayerId,
        )
      : undefined;

    const blackPlayerId = isBotMode
      ? dto.blackPlayerId || `BOT_${botDifficulty}`
      : dto.blackPlayerId ?? null;

    let state = GameState.WAITING;
    if (blackPlayerId) {
      state = this.stateService.transition(state, GameState.STARTING);
      state = this.stateService.transition(state, GameState.IN_PROGRESS);
    }

    const session: ActiveGameSession = {
      id,
      whitePlayerId: dto.whitePlayerId,
      blackPlayerId,
      mode: isBotMode ? 'BOT' : dto.mode || 'PVP',
      botDifficulty,
      state,
      turn: 'w',
      // FIX Lỗi truy cập private: ép kiểu engine sang any
      board: (engine as any).board?.grid,
      fen: 'startpos',
      moves: [],
      hp: this.hpService.createInitialHp(initialHp),
      timers: {
        whiteRemainingMs: initialTimeMs,
        blackRemainingMs: initialTimeMs,
        lastTurnStartedAt: state === GameState.IN_PROGRESS ? now : null,
      },
      disconnectedPlayers: {},
      reconnectTimeoutMs,
      winnerId: null,
      endReason: null,
      createdAt: now,
      updatedAt: now,
      engine,
    };

    this.games.set(id, session);
    if (dto.whitePlayerId) this.playerGameMap.set(dto.whitePlayerId, id);
    if (blackPlayerId && !this.botService.isBotPlayer(blackPlayerId)) {
      this.playerGameMap.set(blackPlayerId, id);
    }

    return session;
  }

  createBotGame(
    playerId: string,
    difficulty: 'EASY' | 'MEDIUM' | 'easy' | 'medium' = 'EASY',
    initialHp = 100,
  ): ActiveGameSession {
    const normalizedDiff = normalizeBotDifficulty(difficulty);
    return this.createGame({
      whitePlayerId: playerId,
      blackPlayerId: `BOT_${normalizedDiff}`,
      mode: 'BOT',
      botDifficulty: normalizedDiff,
      initialHp,
    });
  }

  joinGame(gameId: string, playerId: string): ActiveGameSession {
    const game = this.getGameOrThrow(gameId);

    if (game.whitePlayerId !== playerId && !game.blackPlayerId) {
      game.blackPlayerId = playerId;
      this.playerGameMap.set(playerId, gameId);
    }

    if (
      game.whitePlayerId &&
      game.blackPlayerId &&
      game.state === GameState.WAITING
    ) {
      game.state = this.stateService.transition(game.state, GameState.STARTING);
      game.state = this.stateService.transition(game.state, GameState.IN_PROGRESS);
      game.timers.lastTurnStartedAt = Date.now();
      game.updatedAt = Date.now();
    }

    return game;
  }

  makeMove(dto: MoveDto, server?: any) {
    const game = this.getGameOrThrow(dto.gameId);

    if (!this.stateService.isPlayable(game.state)) {
      throw new BadRequestException(`Game is not playable in state ${game.state}`);
    }

    if (this.checkTimeout(game.id, server)) {
      throw new BadRequestException('Game ended due to timeout');
    }

    const expectedPlayer =
      game.turn === 'w' ? game.whitePlayerId : game.blackPlayerId;
    if (dto.playerId !== expectedPlayer) {
      throw new BadRequestException('Not your turn');
    }

    const playerMoveResult = this.executeSingleMoveOnSession(game, dto);

    if (server) {
      server.to(game.id).emit('move_made', {
        gameId: game.id,
        move: playerMoveResult.moveRecord,
        turn: game.turn,
        board: game.board,
        hp: game.hp,
        state: game.state,
      });
      server.to(game.id).emit('game:move_made', this.serializeGame(game));

      if (game.state === GameState.FINISHED) {
        server.to(game.id).emit('game:finished', this.serializeGame(game));
      }
    }

    let botMoveResult: any = null;
    if (
      this.stateService.isPlayable(game.state) &&
      game.mode === 'BOT' &&
      game.turn === 'b' &&
      this.botService.isBotPlayer(game.blackPlayerId)
    ) {
      botMoveResult = this.makeBotMove(game.id, server);
    }

    return {
      ...this.serializeGame(game),
      lastMove: playerMoveResult.moveRecord,
      botMove: botMoveResult?.lastMove ?? null,
    };
  }

  makeBotMove(gameId: string, server?: any) {
    const game = this.getGameOrThrow(gameId);
    if (!this.stateService.isPlayable(game.state)) {
      return null;
    }

    const botColor = game.turn;
    const difficulty =
      game.botDifficulty ||
      this.botService.resolveDifficulty(undefined, game.blackPlayerId);

    const chosenMove = this.botService.getNextMove(
      game.board,
      botColor,
      difficulty,
    );

    if (!chosenMove) {
      const evalResult = this.checkmateService.evaluateMatchEnd({
        board: game.board,
        nextTurn: botColor,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        hp: game.hp,
        movesCount: game.moves.length,
      });

      if (evalResult.isEnded && evalResult.reason) {
        this.finishGame(game.id, evalResult.winnerId, evalResult.reason);
        if (server) {
          server.to(game.id).emit('game:finished', this.serializeGame(game));
        }
      }
      return this.serializeGame(game);
    }

    const botPlayerId =
      (botColor === 'w' ? game.whitePlayerId : game.blackPlayerId) ||
      `BOT_${difficulty}`;

    const result = this.executeSingleMoveOnSession(game, {
      gameId: game.id,
      playerId: botPlayerId,
      from: chosenMove.from,
      to: chosenMove.to,
      promotion: chosenMove.promotion as any,
    });

    if (server) {
      server.to(game.id).emit('move_made', {
        gameId: game.id,
        move: result.moveRecord,
        turn: game.turn,
        board: game.board,
        hp: game.hp,
        state: game.state,
      });
      server.to(game.id).emit('game:bot_move', {
        gameId: game.id,
        move: result.moveRecord,
        difficulty,
        game: this.serializeGame(game),
      });
      server.to(game.id).emit('game:move_made', this.serializeGame(game));

      if (game.state === GameState.FINISHED) {
        server.to(game.id).emit('game:finished', this.serializeGame(game));
      }
    }

    return {
      ...this.serializeGame(game),
      lastMove: result.moveRecord,
    };
  }

  private executeSingleMoveOnSession(game: ActiveGameSession, dto: MoveDto) {
    const now = Date.now();
    const moverColor = game.turn;

    const fromStr =
      typeof dto.from === 'string'
        ? dto.from
        : coordsToSquare((dto.from as any).row, (dto.from as any).col);
    const toStr =
      typeof dto.to === 'string'
        ? dto.to
        : coordsToSquare((dto.to as any).row, (dto.to as any).col);

    const fromCoords = squareToCoords(fromStr);
    const toCoords = squareToCoords(toStr);
    const movingCell = parseCell(game.board?.[fromCoords.row]?.[fromCoords.col]);
    const targetCell = parseCell(game.board?.[toCoords.row]?.[toCoords.col]);

    if (!movingCell || movingCell.color !== moverColor) {
      throw new BadRequestException('Invalid move');
    }

    let movedByEngine = false;
    // FIX Lỗi truy cập private/không tồn tại: ép kiểu game.engine sang any
    if (game.engine && typeof (game.engine as any).move === 'function') {
      try {
        const engineOk = (game.engine as any).move(fromStr, toStr);
        if (engineOk) {
          movedByEngine = true;
          game.board = (game.engine as any).board.grid;
        }
      } catch {
        movedByEngine = false;
      }
    }

    if (!movedByEngine) {
      const legalMoves = generateLegalMoves(game.board, moverColor);
      const validByRule = legalMoves.some(
        (m) => m.from === fromStr && m.to === toStr,
      );

      if (!validByRule && !this.botService.isBotPlayer(dto.playerId)) {
        throw new BadRequestException('Invalid move');
      }
      game.board = applyMoveOnBoard(game.board, {
        from: fromStr,
        to: toStr,
        promotion: dto.promotion,
      });
      
      // FIX Lỗi truy cập private board
      if ((game.engine as any)?.board) {
        (game.engine as any).board.grid = game.board;
      }
    }

    if (game.timers.lastTurnStartedAt) {
      const elapsed = now - game.timers.lastTurnStartedAt;
      if (moverColor === 'w') {
        game.timers.whiteRemainingMs = Math.max(
          0,
          game.timers.whiteRemainingMs - elapsed,
        );
      } else {
        game.timers.blackRemainingMs = Math.max(
          0,
          game.timers.blackRemainingMs - elapsed,
        );
      }
    }
    game.timers.lastTurnStartedAt = now;

    const nextTurn: 'w' | 'b' = moverColor === 'w' ? 'b' : 'w';
    game.turn = nextTurn;
    
    // FIX Lỗi không tìm thấy turn
    if (game.engine) {
      (game.engine as any).turn = nextTurn === 'w' ? 'white' : 'black';
    }

    const moveRecord = {
      from: fromStr,
      to: toStr,
      playerId: dto.playerId,
      promotion: dto.promotion as any,
      captured: targetCell?.type,
      timestamp: now,
    };
    game.moves.push(moveRecord);
    game.updatedAt = now;

    const preEval = this.checkmateService.evaluateMatchEnd({
      board: game.board,
      nextTurn,
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
      hp: game.hp,
      movesCount: game.moves.length,
    });

    const hpUpdate = this.hpService.applyMoveDamage(game.hp, moverColor, {
      capturedPiece: targetCell?.type ?? null,
      isCheck: preEval.isCheck,
      isCheckmate: preEval.reason === 'CHECKMATE',
    });
    game.hp = hpUpdate.hp;

    const finalEval = this.checkmateService.evaluateMatchEnd({
      board: game.board,
      nextTurn,
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
      hp: game.hp,
      movesCount: game.moves.length,
    });

    if (finalEval.isEnded && finalEval.reason) {
      this.finishGame(game.id, finalEval.winnerId, finalEval.reason);
    } else {
      this.setCheckState(game.id, finalEval.isCheck);
    }

    return { moveRecord, finalEval };
  }

  updatePlayerHp(
    gameId: string,
    targetColor: 'w' | 'b',
    deltaHp: number,
    server?: any,
  ): ActiveGameSession {
    const game = this.getGameOrThrow(gameId);
    if (targetColor === 'w') {
      game.hp.white = Math.max(0, game.hp.white + deltaHp);
    } else {
      game.hp.black = Math.max(0, game.hp.black + deltaHp);
    }

    const hpCheck = this.hpService.checkHpEndCondition(
      game.hp,
      game.whitePlayerId,
      game.blackPlayerId,
    );

    if (hpCheck.isEnded && hpCheck.reason) {
      this.finishGame(game.id, hpCheck.winnerId, hpCheck.reason);
      if (server) {
        server.to(game.id).emit('game:finished', this.serializeGame(game));
      }
    }

    return game;
  }

  setCheckState(gameId: string, isCheck: boolean): ActiveGameSession {
    const game = this.getGameOrThrow(gameId);
    if (game.state === GameState.FINISHED || game.state === GameState.ABORTED) {
      return game;
    }

    if (isCheck && game.state === GameState.IN_PROGRESS) {
      game.state = this.stateService.transition(game.state, GameState.CHECK);
    } else if (!isCheck && game.state === GameState.CHECK) {
      game.state = this.stateService.transition(game.state, GameState.IN_PROGRESS);
    }
    game.updatedAt = Date.now();
    return game;
  }

  finishGame(
    gameId: string,
    winnerId: string | null,
    reason: GameEndReason | string,
  ): ActiveGameSession {
    const game = this.getGameOrThrow(gameId);
    if (game.state !== GameState.FINISHED) {
      if (this.stateService.canTransition(game.state, GameState.FINISHED)) {
        game.state = this.stateService.transition(game.state, GameState.FINISHED);
      } else {
        game.state = GameState.FINISHED;
      }
    }
    game.winnerId = winnerId;
    game.endReason = reason;
    game.timers.lastTurnStartedAt = null;
    game.updatedAt = Date.now();
    return game;
  }

  resignGame(
    gameId: string,
    resigningPlayerId: string,
    server?: any,
  ): ActiveGameSession {
    const game = this.getGameOrThrow(gameId);
    if (
      resigningPlayerId !== game.whitePlayerId &&
      resigningPlayerId !== game.blackPlayerId
    ) {
      throw new BadRequestException('Player is not in this game');
    }

    const winnerId =
      resigningPlayerId === game.whitePlayerId
        ? game.blackPlayerId
        : game.whitePlayerId;

    const finished = this.finishGame(gameId, winnerId, GameEndReason.RESIGN);
    if (server) {
      server.to(gameId).emit('game:finished', this.serializeGame(finished));
    }
    return finished;
  }

  handleDisconnect(playerId: string, server?: any): ActiveGameSession | null {
    const gameId = this.playerGameMap.get(playerId);
    if (!gameId) return null;
    const game = this.games.get(gameId);
    if (!game || !this.stateService.isPlayable(game.state)) return null;

    game.disconnectedPlayers[playerId] = Date.now();
    game.updatedAt = Date.now();

    if (server) {
      server.to(game.id).emit('game:player_disconnected', {
        gameId: game.id,
        playerId,
        reconnectTimeoutMs: game.reconnectTimeoutMs,
      });
    }
    return game;
  }

  handleReconnect(playerId: string, server?: any): ActiveGameSession | null {
    const gameId = this.playerGameMap.get(playerId);
    if (!gameId) return null;
    const game = this.games.get(gameId);
    if (!game) return null;

    delete game.disconnectedPlayers[playerId];
    game.updatedAt = Date.now();

    if (server) {
      server.to(game.id).emit('game:player_reconnected', {
        gameId: game.id,
        playerId,
        game: this.serializeGame(game),
      });
    }
    return game;
  }

  checkTimeout(gameId: string, server?: any): boolean {
    const game = this.getGameOrThrow(gameId);
    if (!this.stateService.isPlayable(game.state)) return false;

    const now = Date.now();

    for (const [disconnectedPlayerId, disconnectedAt] of Object.entries(
      game.disconnectedPlayers,
    )) {
      if (now - disconnectedAt >= game.reconnectTimeoutMs) {
        const winnerId =
          disconnectedPlayerId === game.whitePlayerId
            ? game.blackPlayerId
            : game.whitePlayerId;
        this.finishGame(gameId, winnerId, GameEndReason.DISCONNECT_TIMEOUT);
        if (server) {
          server.to(gameId).emit('game:finished', this.serializeGame(game));
        }
        return true;
      }
    }

    if (game.timers.lastTurnStartedAt) {
      const elapsed = now - game.timers.lastTurnStartedAt;
      const whiteRem =
        game.turn === 'w'
          ? game.timers.whiteRemainingMs - elapsed
          : game.timers.whiteRemainingMs;
      const blackRem =
        game.turn === 'b'
          ? game.timers.blackRemainingMs - elapsed
          : game.timers.blackRemainingMs;

      if (whiteRem <= 0) {
        game.timers.whiteRemainingMs = 0;
        this.finishGame(gameId, game.blackPlayerId, GameEndReason.TIMEOUT);
        if (server) {
          server.to(gameId).emit('game:finished', this.serializeGame(game));
        }
        return true;
      }
      if (blackRem <= 0) {
        game.timers.blackRemainingMs = 0;
        this.finishGame(gameId, game.whitePlayerId, GameEndReason.TIMEOUT);
        if (server) {
          server.to(gameId).emit('game:finished', this.serializeGame(game));
        }
        return true;
      }
    }

    return false;
  }

  addToMatchmaking(socket: any, server: any) {
    this.waitingQueue.push(socket);
    if (this.waitingQueue.length >= 2) {
      const p1 = this.waitingQueue.shift()!;
      const p2 = this.waitingQueue.shift()!;
      const session = this.createGame({
        whitePlayerId: p1.id,
        blackPlayerId: p2.id,
        mode: 'PVP',
      });
      if (typeof p1.join === 'function') p1.join(session.id);
      if (typeof p2.join === 'function') p2.join(session.id);
      if (typeof p1.emit === 'function') {
        p1.emit('match_found', { gameId: session.id, color: 'white' });
      }
      if (typeof p2.emit === 'function') {
        p2.emit('match_found', { gameId: session.id, color: 'black' });
      }
      return session;
    }
    return null;
  }

  handleMove(
    socket: any,
    payload: { gameId: string; from: any; to: any; promotion?: string },
    server?: any,
  ) {
    return this.makeMove(
      {
        gameId: payload.gameId,
        playerId: socket.id,
        from: payload.from,
        to: payload.to,
        promotion: payload.promotion as any, 
      },
      server,
    );
  }

  getGame(gameId: string): ActiveGameSession | undefined {
    return this.games.get(gameId);
  }

  getGameOrThrow(gameId: string): ActiveGameSession {
    const game = this.games.get(gameId);
    if (!game) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }
    return game;
  }

  serializeGame(game: ActiveGameSession) {
    const { engine, ...rest } = game;
    return rest;
  }
}