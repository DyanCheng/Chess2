import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface PersistedMatchSnapshot {
  id: string;
  state: string;
  fen: string;
  moveHistory: Array<{
    color: 'w' | 'b'; from: string; to: string; piece: string; captured?: string;
    promotion?: string; flags?: string; san?: string;
  }>;
  whitePlayerId: string;
  blackPlayerId: string;
  whiteTimeMs: number;
  blackTimeMs: number;
  winner: 'w' | 'b' | 'draw' | null;
  endReason: string | null;
  createdAt: number;
  updatedAt: number;
}

@Injectable()
export class SupabaseService {
  private readonly url = process.env.SUPABASE_URL?.trim();
  private readonly publicKey = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();
  private readonly secretKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();

  get configured(): boolean {
    return Boolean(this.url && this.publicKey);
  }

  get gamePersistenceConfigured(): boolean {
    return Boolean(this.url && this.secretKey);
  }

  publicClient(): SupabaseClient {
    if (!this.url || !this.publicKey) {
      throw new ServiceUnavailableException('Supabase chưa được cấu hình trên backend');
    }
    // Per-request client: never share an Auth session between users.
    return createClient(this.url, this.publicKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }

  userClient(accessToken: string): SupabaseClient {
    if (!this.url || !this.publicKey) {
      throw new ServiceUnavailableException('Supabase chưa được cấu hình trên backend');
    }
    return createClient(this.url, this.publicKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  adminClient(): SupabaseClient {
    if (!this.url || !this.secretKey) {
      throw new ServiceUnavailableException('Chưa cấu hình khóa Supabase bí mật cho backend');
    }
    return createClient(this.url, this.secretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }

  async checkConnection(): Promise<void> {
    const { error } = await this.adminClient().from('matches').select('id').limit(1);
    if (error) throw new Error(`Supabase matches check: ${error.message}`);
  }

  async persistMatch(snapshot: PersistedMatchSnapshot): Promise<void> {
    const client = this.adminClient();
    const status = snapshot.state === 'FINISHED'
      ? (snapshot.winner === 'draw' ? 'DRAW' : 'FINISHED')
      : snapshot.state === 'PAUSED' ? 'DISCONNECTED' : 'PLAYING';
    const winnerId = snapshot.winner === 'w'
      ? snapshot.whitePlayerId
      : snapshot.winner === 'b' ? snapshot.blackPlayerId : null;
    const now = new Date(snapshot.updatedAt).toISOString();

    const { error: matchError } = await client.from('matches').upsert({
      id: snapshot.id,
      match_type: 'PVP',
      status,
      winner_id: winnerId,
      started_at: new Date(snapshot.createdAt).toISOString(),
      ended_at: snapshot.state === 'FINISHED' ? now : null,
      updated_at: now,
      fen: snapshot.fen,
      white_time_ms: snapshot.whiteTimeMs,
      black_time_ms: snapshot.blackTimeMs,
      end_reason: snapshot.endReason,
    }, { onConflict: 'id' });
    if (matchError) throw new Error(`Supabase match upsert: ${matchError.message}`);

    const { error: playersError } = await client.from('match_players').upsert([
      { match_id: snapshot.id, user_id: snapshot.whitePlayerId, color: 'WHITE' },
      { match_id: snapshot.id, user_id: snapshot.blackPlayerId, color: 'BLACK' },
    ], { onConflict: 'match_id,color' });
    if (playersError) throw new Error(`Supabase match players upsert: ${playersError.message}`);

    if (!snapshot.moveHistory.length) return;
    const moves = snapshot.moveHistory.map((move, index) => ({
      match_id: snapshot.id,
      player_id: move.color === 'w' ? snapshot.whitePlayerId : snapshot.blackPlayerId,
      move_number: index + 1,
      from_square: move.from,
      to_square: move.to,
      piece: move.piece,
      captured_piece: move.captured ?? null,
      special_effect: {
        promotion: move.promotion ?? null,
        flags: move.flags ?? null,
        san: move.san ?? null,
      },
    }));
    const { error: movesError } = await client.from('match_moves').upsert(moves, {
      onConflict: 'match_id,move_number', ignoreDuplicates: true,
    });
    if (movesError) throw new Error(`Supabase match moves upsert: ${movesError.message}`);
  }

  async getMatchHistory(playerId: string, page: number, limit: number) {
    const client = this.adminClient();
    const { data: memberships, error: membershipsError } = await client
      .from('match_players').select('match_id').eq('user_id', playerId);
    if (membershipsError) throw new Error(`Supabase match membership select: ${membershipsError.message}`);
    const ids = (memberships ?? []).map(row => row.match_id);
    if (!ids.length) return [];
    const { data, error } = await client.from('matches')
      .select('id,status,winner_id,created_at,updated_at,ended_at,end_reason,fen,white_time_ms,black_time_ms,match_players(user_id,color)')
      .in('id', ids).order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(`Supabase match history select: ${error.message}`);
    return data ?? [];
  }

  async getWallet(userId: string) {
    const { data, error } = await this.adminClient()
      .from('wallets')
      .select('currency,gems,updated_at')
      .eq('user_id', userId)
      .single();
    if (error) throw new Error(`Supabase wallet select: ${error.message}`);
    return data;
  }

  async creditIapPurchase(input: {
    userId: string;
    store: string;
    transactionId: string;
    productId: string;
    environment: 'SANDBOX' | 'PRODUCTION';
    goldDelta: number;
    gemsDelta: number;
    purchasedAt: string;
  }) {
    const { data, error } = await this.adminClient().rpc('credit_iap_purchase', {
      p_user_id: input.userId,
      p_store: input.store,
      p_transaction_id: input.transactionId,
      p_product_id: input.productId,
      p_environment: input.environment,
      p_gold_delta: input.goldDelta,
      p_gems_delta: input.gemsDelta,
      p_purchased_at: input.purchasedAt,
    });
    if (error) throw new Error(`Supabase IAP credit: ${error.message}`);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) throw new Error('Supabase IAP credit did not return a wallet');
    return result as { credited: boolean; currency: number; gems: number };
  }
}
