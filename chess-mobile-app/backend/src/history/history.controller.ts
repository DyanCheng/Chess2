import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
import { HistoryService } from './history.service';

@Controller('matches')
export class HistoryController {
  constructor(private readonly auth: AuthService, private readonly historyService: HistoryService) {}

  private async userId(authorization?: string) {
    const user = await this.auth.getUser(accessTokenFromHeader(authorization));
    return user.id;
  }

  @Get('history')
  async history(
    @Headers('authorization') authorization: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ) {
    const page = Math.max(1, Number.parseInt(rawPage || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(rawLimit || '20', 10) || 20));
    return this.historyService.getHistory(await this.userId(authorization), page, limit);
  }

  @Get(':matchId')
  async detail(@Headers('authorization') authorization: string, @Param('matchId') matchId: string) {
    return this.historyService.getMatchDetail(await this.userId(authorization), matchId);
  }

  @Get(':matchId/replay')
  async replay(@Headers('authorization') authorization: string, @Param('matchId') matchId: string) {
    return this.historyService.getReplay(await this.userId(authorization), matchId);
  }
}
