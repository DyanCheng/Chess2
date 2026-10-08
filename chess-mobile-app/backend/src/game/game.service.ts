import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GameStateService } from './state-machine/game-state.service';
import { GameState } from './state-machine/game-state.enum';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';

@Injectable()
export class GameService {
  // Sử dụng cấu trúc tạm thời (Sau này team bạn sẽ thay bằng DB Repository như Supabase)
  private matches = new Map<string, any>();
  private matchMoves = new Map<string, any[]>(); 

  constructor(private gameStateService: GameStateService) {}

  // BE-008: Create match
  async createMatch(createGameDto: CreateGameDto) {
    const matchId = `match_${Date.now()}`;
    const newMatch = {
      id: matchId,
      player1: createGameDto.playerId,
      player2: null,
      state: GameState.WAITING, // Trạng thái bắt đầu
      createdAt: new Date(),
    };
    
    this.matches.set(matchId, newMatch);
    this.matchMoves.set(matchId, []); // BE-013: Khởi tạo mảng lưu nước đi
    
    return newMatch;
  }

  // BE-009: Get match
  async getMatch(matchId: string) {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new NotFoundException('Không tìm thấy trận đấu');
    }
    const moves = this.matchMoves.get(matchId) || [];
    return { ...match, moves };
  }

  // BE-010 & BE-011 & BE-013: Make move API & Move persistence
  async makeMove(matchId: string, moveDto: MoveDto) {
    const match = this.matches.get(matchId);
    if (!match) throw new NotFoundException('Không tìm thấy trận đấu');

    // BE-011: Quản lý Game state service (Chuyển sang PLAYING nếu trận đấu đang ở READY)
    if (match.state === GameState.READY) {
       match.state = this.gameStateService.transition(match.state, GameState.PLAYING);
    } else if (match.state !== GameState.PLAYING) {
       throw new BadRequestException(`Không thể đi cờ ở trạng thái hiện tại: ${match.state}`);
    }

    // BE-013: Move persistence (Lưu lại lịch sử nước đi)
    const moves = this.matchMoves.get(matchId);
    moves.push({
      ...moveDto,
      timestamp: new Date(),
    });

    // (Tại đây tương lai sẽ tích hợp với Chess Rules Service để validate nước đi)

    // BE-014: Match result handling
    this.handleMatchResult(match);

    return { 
        success: true, 
        matchState: match.state, 
        latestMove: moveDto 
    };
  }

  // BE-014: Match result handling
  private handleMatchResult(match: any) {
    // Tích hợp logic luật cờ vua thật vào đây (Chiếu bí, hết thời gian, hòa...)
    const isCheckmate = false; 
    const isDraw = false;

    if (isCheckmate) {
      match.state = this.gameStateService.transition(match.state, GameState.FINISHED);
    } else if (isDraw) {
      match.state = this.gameStateService.transition(match.state, GameState.DRAW);
    }
  }
}