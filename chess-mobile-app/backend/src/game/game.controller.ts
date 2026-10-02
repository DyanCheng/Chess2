import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  async createMatch(@Body() createGameDto: CreateGameDto) {
    return await this.gameService.createGame(createGameDto);
  }

  @Get(':id')
  async getMatch(@Param('id') id: string) {
    return await this.gameService.getGame(id);
  }

  @Post('move')
  async makeMove(@Body() moveDto: MoveDto) {
    return await this.gameService.makeMove(moveDto);
  }
}