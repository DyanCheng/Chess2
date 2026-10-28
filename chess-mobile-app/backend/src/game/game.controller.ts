import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
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
  async getGame(
    @Param('id') id: string,
    @Headers('authorization') authorization: string,
  ) {
    const user = await this.authService.getUser(accessTokenFromHeader(authorization));
    return this.gameService.getGameStateForPlayer(id, user.id);
  }

  @Post('move')
  async makeMove(
    @Headers('authorization') authorization: string,
    @Body() dto: MoveDto,
  ) {
    const user = await this.authService.getUser(accessTokenFromHeader(authorization));
    const result = this.gameService.makeMove({ ...dto, playerId: user.id });
    await this.gameService.flushGame(dto.gameId);
    return result;
  }
}
