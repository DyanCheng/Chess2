"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChessRuleService = void 0;
const common_1 = require("@nestjs/common");
const chess_js_1 = require("chess.js");
let ChessRuleService = class ChessRuleService {
    constructor() {
        this.games = new Map();
    }
    getGame(matchId, fen) {
        if (!this.games.has(matchId)) {
            this.games.set(matchId, new chess_js_1.Chess(fen));
        }
        return this.games.get(matchId);
    }
    validateAndApply(matchId, from, to, promotion) {
        const game = this.getGame(matchId);
        try {
            const moveResult = game.move({
                from,
                to,
                promotion: promotion ? promotion.toLowerCase() : 'q',
            });
            if (!moveResult) {
                return { success: false, message: 'NÆ°á»›c Ä‘i khĂ´ng há»£p lá»‡' };
            }
            let status = 'IN_PROGRESS';
            let reason = null;
            if (game.isCheckmate()) {
                status = 'CHECKMATE';
            }
            else if (game.isStalemate()) {
                status = 'DRAW';
                reason = 'STALEMATE';
            }
            else if (game.isInsufficientMaterial()) {
                status = 'DRAW';
                reason = 'INSUFFICIENT_MATERIAL';
            }
            else if (game.isDrawByFiftyMoves()) {
                status = 'DRAW';
                reason = 'FIFTY_MOVE_RULE';
            }
            else if (game.isThreefoldRepetition()) {
                status = 'DRAW';
                reason = 'THREEFOLD_REPETITION';
            }
            else if (game.isDraw()) {
                status = 'DRAW';
                reason = 'DRAW';
            }
            return {
                success: true,
                move: {
                    from: moveResult.from,
                    to: moveResult.to,
                    piece: moveResult.piece,
                    captured: moveResult.captured,
                    promotion: moveResult.promotion,
                    isCastling: moveResult.san === 'O-O' || moveResult.san === 'O-O-O',
                    isEnPassant: moveResult.flags.includes('e'),
                },
                fen: game.fen(),
                turn: game.turn(),
                status,
                reason,
                isGameOver: game.isGameOver(),
            };
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
    getSerializedState(matchId) {
        const game = this.getGame(matchId);
        return game.fen();
    }
    restoreState(matchId, fen) {
        try {
            const game = new chess_js_1.Chess(fen);
            this.games.set(matchId, game);
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.ChessRuleService = ChessRuleService;
exports.ChessRuleService = ChessRuleService = __decorate([
    (0, common_1.Injectable)()
], ChessRuleService);
//# sourceMappingURL=chess-rule.service.js.map