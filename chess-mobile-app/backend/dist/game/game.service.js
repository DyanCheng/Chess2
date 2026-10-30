"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const game_state_enum_1 = require("./state-machine/game-state.enum");
const game_state_service_1 = require("./state-machine/game-state.service");
let GameService = class GameService {
    constructor(stateMachine = new game_state_service_1.GameStateService()) {
        this.stateMachine = stateMachine;
        this.games = new Map();
        this.matchmakingQueue = [];
    }
    addToMatchmaking(playerId, client, server) {
        const existingIndex = this.matchmakingQueue.findIndex((p) => p.playerId === playerId);
        if (existingIndex !== -1) {
            this.matchmakingQueue[existingIndex].socket = client;
            return null;
        }
        this.matchmakingQueue.push({ playerId, socket: client });
        if (this.matchmakingQueue.length < 2) {
            return null;
        }
        const whitePlayer = this.matchmakingQueue.shift();
        const blackPlayer = this.matchmakingQueue.shift();
        const game = this.createGame({
            whitePlayerId: whitePlayer.playerId,
            blackPlayerId: blackPlayer.playerId,
            mode: 'PVP',
        });
        whitePlayer.socket?.join?.(game.id);
        blackPlayer.socket?.join?.(game.id);
        server?.to?.(game.id)?.emit(game_state_enum_1.GameSocketEvent.MATCH_FOUND, {
            gameId: game.id,
            white: game.whitePlayerId,
            black: game.blackPlayerId,
            state: game.state,
            fen: game.fen,
        });
        return game;
    }
    handleMove(playerId, gameId, from, to, server, promotion) {
        const game = this.games.get(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }
        if (!this.stateMachine.isPlayable(game.state)) {
            server?.to?.(gameId)?.emit(game_state_enum_1.GameSocketEvent.MOVE_REJECTED, {
                gameId,
                playerId,
                reason: `Invalid game state: ${game.state}`,
            });
            return { success: false, error: `Invalid game state: ${game.state}` };
        }
        const activePlayerId = game.turn === 'w' ? game.whitePlayerId : game.blackPlayerId;
        if (playerId !== activePlayerId) {
            server?.to?.(gameId)?.emit(game_state_enum_1.GameSocketEvent.MOVE_REJECTED, {
                gameId,
                playerId,
                reason: 'Not your turn',
            });
            return { success: false, error: 'Not your turn' };
        }
        if (!this.isValidBoardMove(game.board, from, to, game.turn)) {
            server?.to?.(gameId)?.emit(game_state_enum_1.GameSocketEvent.MOVE_REJECTED, {
                gameId,
                playerId,
                reason: 'Illegal move',
            });
            return { success: false, error: 'Illegal move' };
        }
        const movingPiece = game.board[from.row][from.col];
        const targetPiece = game.board[to.row][to.col];
        game.board[from.row][from.col] = '';
        if (movingPiece.toLowerCase() === 'p' &&
            (to.row === 0 || to.row === 7)) {
            const promoChar = promotion || 'q';
            game.board[to.row][to.col] =
                game.turn === 'w' ? promoChar.toUpperCase() : promoChar.toLowerCase();
        }
        else {
            game.board[to.row][to.col] = movingPiece;
        }
        game.moves.push({
            from,
            to,
            playerId,
            promotion,
            timestamp: Date.now(),
        });
        game.turn = game.turn === 'w' ? 'b' : 'w';
        const fullMoveNumber = Math.floor(game.moves.length / 2) + 1;
        game.fen = this.boardToFen(game.board, game.turn, fullMoveNumber);
        game.updatedAt = Date.now();
        if (targetPiece && targetPiece.toLowerCase() === 'k') {
            this.finishGame(game.id, playerId, game_state_enum_1.GameEndReason.CHECKMATE);
        }
        else if (game.state === game_state_enum_1.GameState.CHECK) {
            game.state = this.stateMachine.transition(game.state, game_state_enum_1.GameState.IN_PROGRESS);
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
        server?.to?.(game.id)?.emit(game_state_enum_1.GameSocketEvent.MOVE_MADE, movePayload);
        if (game.state === game_state_enum_1.GameState.FINISHED) {
            server?.to?.(game.id)?.emit(game_state_enum_1.GameSocketEvent.GAME_OVER, {
                gameId: game.id,
                winnerId: game.winnerId,
                reason: game.endReason,
                state: game.state,
            });
        }
        return { success: true, game };
    }
    createGame(dto = {}) {
        const gameId = dto?.id || `game_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const mode = dto?.mode || (dto?.blackPlayerId === 'BOT' ? 'BOT' : 'PVP');
        const hasBothPlayers = Boolean(dto?.whitePlayerId && (dto?.blackPlayerId || mode === 'BOT'));
        let initialState = game_state_enum_1.GameState.WAITING;
        if (hasBothPlayers) {
            initialState = this.stateMachine.transition(game_state_enum_1.GameState.WAITING, game_state_enum_1.GameState.STARTING);
            initialState = this.stateMachine.transition(initialState, game_state_enum_1.GameState.IN_PROGRESS);
        }
        const board = this.createInitialBoard();
        const session = {
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
    joinGame(gameId, playerId) {
        const game = this.getGameOrThrow(gameId);
        if (!game.blackPlayerId && game.whitePlayerId !== playerId) {
            game.blackPlayerId = playerId;
        }
        if (game.state === game_state_enum_1.GameState.WAITING &&
            game.whitePlayerId &&
            game.blackPlayerId) {
            game.state = this.stateMachine.transition(game.state, game_state_enum_1.GameState.IN_PROGRESS);
            game.updatedAt = Date.now();
        }
        return game;
    }
    makeMove(dto, server) {
        const gameId = dto?.gameId || dto?.id;
        const game = this.getGameOrThrow(gameId);
        const from = this.normalizePosition(dto.from);
        const to = this.normalizePosition(dto.to);
        const playerId = dto?.playerId ||
            (game.turn === 'w' ? game.whitePlayerId : game.blackPlayerId || 'black');
        const result = this.handleMove(playerId, gameId, from, to, server, dto?.promotion);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error);
        }
        return result.game;
    }
    finishGame(gameId, winnerId, reason = game_state_enum_1.GameEndReason.CHECKMATE) {
        const game = this.getGameOrThrow(gameId);
        if (!this.stateMachine.isTerminal(game.state)) {
            game.state = this.stateMachine.transition(game.state, game_state_enum_1.GameState.FINISHED);
            game.winnerId = winnerId;
            game.endReason = reason;
            game.updatedAt = Date.now();
        }
        return game;
    }
    resignGame(gameId, resigningPlayerId) {
        const game = this.getGameOrThrow(gameId);
        const winnerId = resigningPlayerId === game.whitePlayerId
            ? game.blackPlayerId
            : game.whitePlayerId;
        return this.finishGame(gameId, winnerId ?? null, game_state_enum_1.GameEndReason.RESIGNATION);
    }
    getGame(gameId) {
        return this.games.get(gameId);
    }
    getGameOrThrow(gameId) {
        const game = this.games.get(gameId);
        if (!game) {
            throw new common_1.NotFoundException(`Game not found: ${gameId}`);
        }
        return game;
    }
    normalizePosition(pos) {
        if (typeof pos === 'object' && pos !== null) {
            return { row: Number(pos.row), col: Number(pos.col) };
        }
        const clean = String(pos).trim().toLowerCase();
        const col = clean.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(clean[1], 10);
        return { row: 8 - rank, col };
    }
    isValidBoardMove(board, from, to, turn) {
        if (!from ||
            !to ||
            from.row < 0 ||
            from.row > 7 ||
            from.col < 0 ||
            from.col > 7 ||
            to.row < 0 ||
            to.row > 7 ||
            to.col < 0 ||
            to.col > 7) {
            return false;
        }
        if (from.row === to.row && from.col === to.col) {
            return false;
        }
        const piece = board[from.row]?.[from.col];
        if (!piece) {
            return false;
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
                if (dc === 0 &&
                    from.row === startRow &&
                    dr === 2 * dir &&
                    !target &&
                    !board[from.row + dir][from.col]) {
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
                return ((dr === 0 || dc === 0 || absDr === absDc) &&
                    this.isPathClear(board, from, to));
            case 'k':
                return absDr <= 1 && absDc <= 1;
            default:
                return false;
        }
    }
    isPathClear(board, from, to) {
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
    boardToFen(board, turn, fullMoveNumber = 1) {
        const rows = board.map((row) => {
            let empty = 0;
            let str = '';
            for (const cell of row) {
                if (!cell) {
                    empty++;
                }
                else {
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
    createInitialBoard() {
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
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [game_state_service_1.GameStateService])
], GameService);
//# sourceMappingURL=game.service.js.map