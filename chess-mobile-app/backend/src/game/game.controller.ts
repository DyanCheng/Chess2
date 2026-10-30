// chess-mobile-app/backend/src/game/game.controller.ts
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GameService } from './game.service';
import { MoveDto } from './dto/move.dto';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly authService: AuthService,
  ) {}

  @Post('create')
  createGame() {
    throw new ForbiddenException('Hãy tạo ván PvP qua matchmaking đã đăng nhập');
  }

  @Post('bot')
  async createBotGame(
    @Headers('authorization') authorization: string,
    @Body()
    body: {
      difficulty?: 'EASY' | 'MEDIUM' | 'easy' | 'medium';
      initialHp?: number;
    },
  ) {
    const user = await this.authService.getUser(accessTokenFromHeader(authorization));
    const game = this.gameService.createBotGame(
      user.id,
      body?.difficulty || 'EASY',
      body?.initialHp ?? 100,
    );
    return this.gameService.serializeGame(game);
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
