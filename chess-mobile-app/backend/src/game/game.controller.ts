import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create')
  createGame(@Body() dto: CreateGameDto) {
    const game = this.gameService.createGame(dto);
    return this.gameService.serializeGame(game);
  }

  @Post('bot')
  createBotGame(
    @Body()
    body: {
      playerId: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'easy' | 'medium';
      initialHp?: number;
    },
  ) {
    const game = this.gameService.createBotGame(
      body.playerId,
      body.difficulty || 'EASY',
      body.initialHp ?? 100,
    );
    return this.gameService.serializeGame(game);
  }

  @Get(':id')
  getGame(@Param('id') id: string) {
    const game = this.gameService.getGameOrThrow(id);
    return this.gameService.serializeGame(game);
  }

  @Post('move')
  makeMove(@Body() dto: MoveDto) {
    return this.gameService.makeMove(dto);
  }
}