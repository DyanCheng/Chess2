import { Controller, Get, Headers, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
import { SupabaseService } from '../database/supabase.service';

@Controller('rank')
export class RankController {
  constructor(private readonly auth: AuthService, private readonly supabase: SupabaseService) {}

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const user = await this.auth.getUser(accessTokenFromHeader(authorization));
    const data = await this.supabase.getUserRank(user.id);
    if (!data) throw new NotFoundException('Chưa cấu hình mùa xếp hạng hoặc chế độ chơi');
    const rank = data.rank;
    return {
      season: {
        id: data.season.id,
        name: data.season.name,
        startAt: data.season.start_at,
        endAt: data.season.end_at,
      },
      rank: {
        id: rank?.id || `unranked-${user.id}`,
        rankPoints: Number(rank?.rank_points ?? 1000),
        wins: Number(rank?.wins ?? 0),
        losses: Number(rank?.losses ?? 0),
        draws: Number(rank?.draws ?? 0),
        updatedAt: rank?.updated_at || new Date().toISOString(),
        tier: {
          id: data.tier.id,
          code: data.tier.code,
          name: data.tier.name,
          minPoints: Number(data.tier.min_points),
          order: Number(data.tier.tier_order),
        },
      },
      history: data.history.map(entry => ({
        id: entry.id,
        matchId: entry.match_id,
        pointsBefore: Number(entry.points_before),
        pointsChange: Number(entry.points_change),
        pointsAfter: Number(entry.points_after),
        createdAt: entry.created_at,
      })),
    };
  }
}
