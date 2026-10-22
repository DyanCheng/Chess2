import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create')
  createGame(@Body() dto: CreateGameDto) {
    return this.gameService.createGame(dto);
  }

  @Get(':id')
  getGame(@Param('id') id: string) {
    // Đã đổi từ getGameOrThrow sang getGameState
    return this.gameService.getGameState(id);
  }

  @Post(':id/move')
  makeMove(@Param('id') id: string, @Body() dto: MoveDto) {
    // Truyền đủ 2 tham số: gameId và dto
    return this.gameService.makeMove(id, dto);
  }
}