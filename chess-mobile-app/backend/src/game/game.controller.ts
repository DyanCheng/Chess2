// chess-mobile-app/backend/src/game/game.controller.ts
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
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
    return this.gameService.getGameOrThrow(id);
  }

  @Post('move')
  makeMove(@Body() dto: MoveDto) {
    return this.gameService.makeMove(dto);
  }
}