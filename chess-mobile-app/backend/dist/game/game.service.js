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
const supabase_service_1 = require("../database/supabase.service");
const game_state_enum_1 = require("./state-machine/game-state.enum");
let GameService = class GameService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async createGame(createGameDto) {
        const { data, error } = await this.supabase.client
            .from('games')
            .insert([
            {
                host_id: createGameDto.hostId,
                guest_id: createGameDto.guestId,
                state: game_state_enum_1.GameState.WAITING,
                board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                game_type: createGameDto.gameType || 'PvP'
            }
        ])
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getGame(gameId) {
        const { data, error } = await this.supabase.client
            .from('games')
            .select('*, moves(*)')
            .eq('id', gameId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Match not found');
        return data;
    }
    async makeMove(moveDto) {
        const game = await this.getGame(moveDto.gameId);
        if (game.state !== game_state_enum_1.GameState.IN_PROGRESS) {
            throw new common_1.BadRequestException('Game is not in progress');
        }
        const newFen = 'chuoi-fen-moi-tam-thoi';
        const notation = `${moveDto.from}${moveDto.to}${moveDto.promotion || ''}`;
        await this.supabase.client.from('game_moves').insert([{
                game_id: moveDto.gameId,
                player_id: moveDto.playerId,
                move_notation: notation,
                fen_after: newFen,
                created_at: new Date()
            }]);
        await this.supabase.client.from('games')
            .update({ board_state: newFen })
            .eq('id', moveDto.gameId);
        return { success: true, newFen };
    }
    async handleMatchResult(gameId, winnerId, resultReason) {
        await this.supabase.client.from('games')
            .update({
            state: game_state_enum_1.GameState.FINISHED,
            winner_id: winnerId,
            result_reason: resultReason
        })
            .eq('id', gameId);
        if (winnerId) {
            await this.supabase.client.rpc('calculate_reward', {
                p_game_id: gameId,
                p_winner_id: winnerId
            });
        }
        return { message: 'Match result processed successfully' };
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], GameService);
//# sourceMappingURL=game.service.js.map