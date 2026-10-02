import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameState } from './state-machine/game-state.enum';
import { MoveDto } from './dto/move.dto';

@Injectable()
export class GameService {
  constructor(private readonly supabase: SupabaseService) {}

  // BE-008: Create match
  async createGame(createGameDto: CreateGameDto) {
    const { data, error } = await this.supabase.client
      .from('games')
      .insert([
        {
          host_id: createGameDto.hostId,
          guest_id: createGameDto.guestId,
          state: GameState.WAITING,
          board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // FEN mặc định
          game_type: createGameDto.gameType || 'PvP'
        }
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // BE-009: Get match
  async getGame(gameId: string) {
    const { data, error } = await this.supabase.client
      .from('games')
      .select('*, moves(*)') // Lấy trận đấu kèm lịch sử di chuyển
      .eq('id', gameId)
      .single();

    if (error || !data) throw new NotFoundException('Match not found');
    return data;
  }

  // BE-010 & BE-013: Make move API và Move persistence
  async makeMove(moveDto: MoveDto) {
    // 1. Lấy trạng thái trận đấu
    const game = await this.getGame(moveDto.gameId);
    if (game.state !== GameState.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    // 2. Kiểm tra tính hợp lệ (Gọi đến thư mục rules/ movement.service.ts)
    // const isValid = this.movementService.validate(game.board_state, moveDto);
    
    // 3. Tính toán FEN mới
    const newFen = 'chuoi-fen-moi-tam-thoi';
    
    // 4. BE-013: Move persistence - Lưu vào bảng game_moves (migration 003_create_game_moves.sql)
    const notation = `${moveDto.from}${moveDto.to}${moveDto.promotion || ''}`;
    await this.supabase.client.from('game_moves').insert([{
      game_id: moveDto.gameId,
      player_id: moveDto.playerId,
      move_notation: notation,
      fen_after: newFen,
      created_at: new Date()
    }]);

    // 5. Cập nhật FEN mới vào bảng games
    await this.supabase.client.from('games')
      .update({ board_state: newFen })
      .eq('id', moveDto.gameId);

    // 6. Phát sự kiện realtime qua Gateway
    // this.gameGateway.server.to(moveDto.gameId).emit('move_made', moveDto);

    return { success: true, newFen };
  }

  // BE-014: Match result handling
  async handleMatchResult(gameId: string, winnerId: string | null, resultReason: string) {
    // Đổi trạng thái trận đấu thành FINISHED
    await this.supabase.client.from('games')
      .update({ 
        state: GameState.FINISHED,
        winner_id: winnerId,
        result_reason: resultReason // 'CHECKMATE', 'RESIGN', 'DRAW', 'TIMEOUT'
      })
      .eq('id', gameId);

    // Xử lý phần thưởng và trừ điểm (HP) dựa trên Database Functions có sẵn[cite: 1]
    if (winnerId) {
      // Giả sử có hàm tính phần thưởng
      await this.supabase.client.rpc('calculate_reward', { 
        p_game_id: gameId, 
        p_winner_id: winnerId 
      });
      
      // Giả sử lấy được loserId từ dữ liệu trận đấu
      // await this.supabase.client.rpc('update_player_hp', {
      //   p_player_id: loserId,
      //   p_hp_change: -10 
      // });
    }

    return { message: 'Match result processed successfully' };
  }
}