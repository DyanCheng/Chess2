import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GameStateService } from './state-machine/game-state.service';
import { GameState } from './state-machine/game-state.enum';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';
import { ChessRuleService } from './rules/chess-rule.service';

@Injectable()
export class GameService {
  private matches = new Map<string, any>();
  private matchMoves = new Map<string, any[]>(); 

  constructor(
    private gameStateService: GameStateService,
    private chessRuleService: ChessRuleService, // Inject ChessRuleService
  ) {}

  // BE-008: Create match
  async createMatch(createGameDto: CreateGameDto) {
    const matchId = `match_${Date.now()}`;
    const newMatch = {
      id: matchId,
      player1: createGameDto.playerId,
      player2: null,
      state: GameState.WAITING,
      createdAt: new Date(),
    };
    
    this.matches.set(matchId, newMatch);
    this.matchMoves.set(matchId, []); 
    
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

    // Gọi ChessRuleService để validate và áp dụng nước đi (Service sẽ tự throw BadRequestException nếu sai luật)
    const result = this.chessRuleService.validateAndApply(
      matchId,
      moveDto.from, // Ô bắt đầu (ví dụ: 'e2')
      moveDto.to,   // Ô đích đến (ví dụ: 'e4')
      moveDto.promotion // Mã phong cấp nếu có (q, r, b, n)
    );

    // BE-013: Move persistence (Lưu lại lịch sử nước đi)
    const moves = this.matchMoves.get(matchId);
    moves.push({
      ...moveDto,
      timestamp: new Date(),
    });

    // Kiểm tra xem ván đấu đã kết thúc chưa sau nước đi này
    if (this.chessRuleService.isGameOver(matchId)) {
      match.state = this.gameStateService.transition(match.state, GameState.FINISHED);
    }

    // BE-014: Match result handling
    this.handleMatchResult(match);

    return { 
        success: true, 
        matchState: match.state, 
        latestMove: moveDto,
        currentTurn: result.turn 
    };
  }

  // BE-014: Match result handling
  private handleMatchResult(match: any) {
    const isDraw = false;

    if (isDraw && match.state !== GameState.FINISHED) {
      match.state = this.gameStateService.transition(match.state, GameState.DRAW);
    }
  }
}