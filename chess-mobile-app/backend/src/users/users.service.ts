import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async getProfile(userId: string, email?: string) {
    const { profile, wallet } = await this.supabase.getPlayerProfile(userId);
    const stats = await this.getStats(userId);
    return {
      id: profile.id,
      email: email ?? null,
      username: profile.username || profile.display_name || 'Kỳ thủ',
      avatarUrl: profile.avatar_url || '',
      level: Number(profile.level ?? 1),
      experience: Number(profile.experience ?? 0),
      rating: stats.rating,
      gold: Number(wallet?.currency ?? 0),
      gems: Number(wallet?.gems ?? 0),
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  async getStats(userId: string) {
    const [matches, rating] = await Promise.all([
      this.supabase.getPlayerMatchStats(userId),
      this.supabase.getPlayerRating(userId),
    ]);
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalDurationMs = 0;
    let timedGames = 0;
    let currentWinStreak = 0;
    let longestWinStreak = 0;
    let runningStreak = 0;

    for (const match of [...matches].reverse()) {
      if (match.status === 'DRAW' || !match.winner_id) {
        draws += 1;
        runningStreak = 0;
      } else if (match.winner_id === userId) {
        wins += 1;
        runningStreak += 1;
        longestWinStreak = Math.max(longestWinStreak, runningStreak);
      } else {
        losses += 1;
        runningStreak = 0;
      }
      if (match.started_at && match.ended_at) {
        const duration = Date.parse(match.ended_at) - Date.parse(match.started_at);
        if (Number.isFinite(duration) && duration >= 0) {
          totalDurationMs += duration;
          timedGames += 1;
        }
      }
    }

    for (const match of matches) {
      if (match.winner_id === userId) currentWinStreak += 1;
      else break;
    }
    const totalGames = wins + losses + draws;
    return {
      totalGames,
      wins,
      losses,
      draws,
      winRate: totalGames ? Math.round((wins / totalGames) * 1000) / 10 : 0,
      rating,
      avgGameDuration: timedGames ? Math.round(totalDurationMs / timedGames / 1000) : 0,
      currentWinStreak,
      longestWinStreak,
      favoriteOpening: '',
      totalCardsUsed: 0,
      totalPiecesCaptured: 0,
    };
  }

  async getLeaderboard(limit: number) {
    const rows = await this.supabase.getLeaderboard(limit);
    return rows.filter(row => row.profile).map(row => ({
      rank: row.rank,
      rating: row.rankPoints,
      wins: row.wins,
      player: {
        id: row.profile.id,
        username: row.profile.username || row.profile.display_name || 'Kỳ thủ',
        avatarUrl: row.profile.avatar_url || '',
        level: Number(row.profile.level ?? 1),
        experience: Number(row.profile.experience ?? 0),
        experienceToNextLevel: 0,
        rating: row.rankPoints,
        gold: 0,
        gems: 0,
        maxHP: 100,
        currentHP: 100,
        wins: row.wins,
        losses: row.losses,
        draws: row.draws,
        createdAt: row.profile.created_at,
        lastOnline: row.profile.updated_at,
      },
    }));
  }
}
