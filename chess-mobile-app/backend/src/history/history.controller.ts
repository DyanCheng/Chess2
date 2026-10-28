import { Controller, Get, Headers, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
import { SupabaseService } from '../database/supabase.service';

@Controller('matches')
export class HistoryController {
  constructor(private readonly auth: AuthService, private readonly supabase: SupabaseService) {}

  @Get('history')
  async history(
    @Headers('authorization') authorization: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ) {
    const token = accessTokenFromHeader(authorization);
    const user = await this.auth.getUser(token);
    const page = Math.max(1, Number.parseInt(rawPage || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(rawLimit || '20', 10) || 20));
    const matches = await this.supabase.getMatchHistory(user.id, page, limit);
    return { matches, page, limit };
  }
}
