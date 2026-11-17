import { BadRequestException, Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
import { SupabaseService } from '../database/supabase.service';

const PUZZLES = [
  ['mate-in-one-1', 'h5f7'],
  ['mate-in-one-2', 'd6h6'],
  ['mate-in-one-3', 'e6a6'],
  ['mate-in-one-4', 'g5d2'],
  ['mate-in-one-5', 'a1h8'],
] as const;

@Controller('puzzles')
export class PuzzlesController {
  constructor(private readonly auth: AuthService, private readonly supabase: SupabaseService) {}

  private async userId(authorization?: string) {
    return (await this.auth.getUser(accessTokenFromHeader(authorization))).id;
  }

  private decorate(progress: any) {
    const completed = Array.isArray(progress?.completedPuzzleIds) ? progress.completedPuzzleIds : [];
    const day = Math.floor(Date.parse(`${progress.today}T00:00:00Z`) / 86_400_000);
    const dailyPuzzleId = PUZZLES[Math.abs(day) % PUZZLES.length][0];
    const unlockedPuzzleId = PUZZLES.find(([id], index) => !completed.includes(id) && (index === 0 || completed.includes(PUZZLES[index - 1][0])))?.[0] ?? null;
    return { ...progress, completedPuzzleIds: completed, dailyPuzzleId, unlockedPuzzleId };
  }

  @Get('progress')
  async progress(@Headers('authorization') authorization?: string) {
    return this.decorate(await this.supabase.getPuzzleProgress(await this.userId(authorization)));
  }

  @Post('complete')
  async complete(
    @Headers('authorization') authorization: string,
    @Body() body: { puzzleId: string; solutionUci: string; dailyChallenge: boolean },
  ) {
    const index = PUZZLES.findIndex(([id]) => id === body?.puzzleId);
    if (index < 0 || PUZZLES[index][1] !== body?.solutionUci) {
      throw new BadRequestException('Lời giải không hợp lệ');
    }
    const userId = await this.userId(authorization);
    if (body.dailyChallenge) {
      const current = this.decorate(await this.supabase.getPuzzleProgress(userId));
      if (current.dailyPuzzleId !== body.puzzleId) {
        throw new BadRequestException('Đây không phải bài giải đố hôm nay');
      }
    }
    const progress = await this.supabase.recordPuzzleCompletion({
      userId,
      puzzleId: body.puzzleId,
      requiredPreviousId: body.dailyChallenge ? null : index > 0 ? PUZZLES[index - 1][0] : null,
      dailyChallenge: Boolean(body.dailyChallenge),
    });
    return this.decorate(progress);
  }
}
