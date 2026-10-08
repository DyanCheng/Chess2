import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';

@Controller('matches')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // BE-008: Create match
  @Post()
  async createMatch(@Body() createGameDto: CreateGameDto) {
    return this.gameService.createMatch(createGameDto);
  }

  // BE-009: Get match
  @Get(':matchId')
  async getMatch(@Param('matchId') matchId: string) {
    return this.gameService.getMatch(matchId);
  }

  // BE-010: Make move API
  @Post(':matchId/move')
  async makeMove(
    @Param('matchId') matchId: string,
    @Body() moveDto: MoveDto,
  ) {
    return this.gameService.makeMove(matchId, moveDto);
  }
}