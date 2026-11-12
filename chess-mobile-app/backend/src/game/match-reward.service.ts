import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

const PVP_REWARDS = {
  win: { currency: 30, experience: 25 },
  loss: { currency: 5, experience: 10 },
  draw: { currency: 15, experience: 15 },
} as const;

export interface MatchRewardResult {
  userId: string;
  status: 'credited' | 'already_credited' | 'failed';
  currencyBalance: number | null;
  experienceBalance: number | null;
}

@Injectable()
export class MatchRewardService {
  private readonly logger = new Logger(MatchRewardService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async creditFinishedMatch(matchId: string): Promise<MatchRewardResult[]> {
    const client = this.supabase.adminClient();
    const { data: match, error: matchError } = await client
      .from('matches')
      .select('status,winner_id')
      .eq('id', matchId)
      .maybeSingle();

    if (matchError) {
      this.logger.error(`Unable to load match ${matchId} for reward: ${matchError.message}`);
      throw new Error(`Supabase match reward lookup: ${matchError.message}`);
    }

    if (!match || !['FINISHED', 'DRAW'].includes(String(match.status))) {
      return [];
    }

    const { data: players, error: playersError } = await client
      .from('match_players')
      .select('user_id')
      .eq('match_id', matchId);

    if (playersError) {
      this.logger.error(`Unable to load players for match ${matchId}: ${playersError.message}`);
      throw new Error(`Supabase match players reward lookup: ${playersError.message}`);
    }

    const userIds = [...new Set((players ?? []).map(player => player.user_id as string))];
    if (userIds.length !== 2) {
      this.logger.error(`Match ${matchId} has ${userIds.length} reward participants; expected 2`);
      throw new Error(`Invalid reward participants for match ${matchId}`);
    }

    const winnerId = match.winner_id as string | null;
    if (match.status === 'FINISHED' && (!winnerId || !userIds.includes(winnerId))) {
      this.logger.error(`Finished match ${matchId} has no valid winner`);
      throw new Error(`Invalid winner for finished match ${matchId}`);
    }
    if (match.status === 'DRAW' && winnerId) {
      this.logger.error(`Draw match ${matchId} unexpectedly has a winner`);
      throw new Error(`Invalid winner for drawn match ${matchId}`);
    }

    const results: MatchRewardResult[] = [];
    for (const userId of userIds) {
      const reward = match.status === 'DRAW'
        ? PVP_REWARDS.draw
        : userId === winnerId ? PVP_REWARDS.win : PVP_REWARDS.loss;
      const { data, error } = await client.rpc('credit_match_reward', {
        p_match_id: matchId,
        p_user_id: userId,
        p_currency_amount: reward.currency,
        p_experience_amount: reward.experience,
        p_card_id: null,
        p_card_quantity: 0,
      });

      if (error) {
        this.logger.error(`Reward RPC failed for match ${matchId}, player ${userId}: ${error.message}`);
        results.push({
          userId,
          status: 'failed',
          currencyBalance: null,
          experienceBalance: null,
        });
        continue;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (!result) {
        this.logger.error(`Reward RPC returned no result for match ${matchId}, player ${userId}`);
        results.push({
          userId,
          status: 'failed',
          currencyBalance: null,
          experienceBalance: null,
        });
        continue;
      }

      results.push({
        userId,
        status: result.credited ? 'credited' : 'already_credited',
        currencyBalance: Number(result.currency),
        experienceBalance: Number(result.experience),
      });
    }

    return results;
  }
}
