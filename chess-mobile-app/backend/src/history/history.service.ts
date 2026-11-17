import { Injectable, NotFoundException } from '@nestjs/common';
import { Chess } from 'chess.js';
import { SupabaseService } from '../database/supabase.service';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

@Injectable()
export class HistoryService {
  constructor(private readonly supabase: SupabaseService) {}

  async getHistory(userId: string, page: number, limit: number) {
    return { matches: await this.supabase.getMatchHistory(userId, page, limit), page, limit };
  }

  async getMatchDetail(userId: string, matchId: string) {
    const match = await this.supabase.getMatchForPlayer(userId, matchId);
    if (!match) throw new NotFoundException('Không tìm thấy ván cờ hoặc bạn không thuộc ván này');
    return match;
  }

  async getReplay(userId: string, matchId: string) {
    const match = await this.getMatchDetail(userId, matchId);
    const chess = new Chess(INITIAL_FEN);
    const sortedMoves = [...(match.match_moves ?? [])]
      .sort((a, b) => Number(a.move_number) - Number(b.move_number));
    const moves = sortedMoves.map(move => {
      const promotion = move.special_effect?.promotion || undefined;
      let valid = false;
      let san = move.special_effect?.san || null;
      try {
        const result = chess.move({ from: move.from_square, to: move.to_square, promotion });
        valid = Boolean(result);
        san = result?.san ?? san;
      } catch {
        // Arcane effects may create a position chess.js cannot replay as orthodox chess.
      }
      return {
        step: Number(move.move_number),
        from: move.from_square,
        to: move.to_square,
        piece: move.piece,
        captured: move.captured_piece,
        promotion: promotion ?? null,
        san,
        playedBy: move.player_id,
        playedAt: move.timestamp,
        valid,
        fenAfter: chess.fen(),
      };
    });
    const white = (match.match_players ?? []).find(player => player.color === 'WHITE');
    const black = (match.match_players ?? []).find(player => player.color === 'BLACK');
    return {
      matchId: match.id,
      initialFen: INITIAL_FEN,
      finalFen: match.fen || chess.fen(),
      winner: match.winner_id,
      endReason: match.end_reason,
      startedAt: match.started_at || match.created_at,
      endedAt: match.ended_at,
      players: {
        white: white ? { userId: white.user_id, currentHp: white.current_hp } : null,
        black: black ? { userId: black.user_id, currentHp: black.current_hp } : null,
      },
      totalSteps: moves.length,
      moves,
    };
  }
}
