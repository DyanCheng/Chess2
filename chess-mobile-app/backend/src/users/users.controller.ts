import { Body, Controller, Get, Headers, Put, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
import { UsersService } from './users.service';

@Controller('player')
export class UsersController {
  constructor(private readonly auth: AuthService, private readonly users: UsersService) {}

  @Get('profile')
  async profile(@Headers('authorization') authorization?: string) {
    const user = await this.auth.getUser(accessTokenFromHeader(authorization));
    return this.users.getProfile(user.id, user.email);
  }

  @Put('profile')
  async updateProfile(@Headers('authorization') authorization: string, @Body() body: { username: string }) {
    const token = accessTokenFromHeader(authorization);
    await this.auth.updateProfile(token, body?.username);
    const user = await this.auth.getUser(token);
    return this.users.getProfile(user.id, user.email);
  }

  @Get('stats')
  async stats(@Headers('authorization') authorization?: string) {
    const user = await this.auth.getUser(accessTokenFromHeader(authorization));
    return this.users.getStats(user.id);
  }

  @Get('leaderboard')
  leaderboard(@Query('limit') rawLimit?: string) {
    const limit = Math.min(100, Math.max(1, Number.parseInt(rawLimit || '50', 10) || 50));
    return this.users.getLeaderboard(limit);
  }
}
