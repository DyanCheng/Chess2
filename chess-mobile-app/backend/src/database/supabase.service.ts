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

  async getActiveShopItems(userId: string) {
    const client = this.adminClient();
    const { data: items, error: itemsError } = await client
      .from('shop_items')
      .select('id,name,description,item_type,reference_id,price,currency_type,stock,is_active,reward_currency,reward_gems,is_repeatable')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (itemsError) throw new Error(`Supabase shop items select: ${itemsError.message}`);
    if (!items?.length) return [];

    const cardIds = (items ?? [])
      .filter(item => item.item_type === 'CARD' && item.reference_id)
      .map(item => item.reference_id);
    const cardDefinitions = new Map<string, {
      id: string;
      name: string;
      description: string | null;
      effectType: string;
      value: number;
    }>();
    if (cardIds.length) {
      const { data: definitions, error: definitionsError } = await client
        .from('function_cards')
        .select('id,name,description,effect_type,effect_value')
        .in('id', cardIds);
      if (definitionsError) {
        throw new Error(`Supabase shop card definitions select: ${definitionsError.message}`);
      }
      for (const card of definitions ?? []) {
        cardDefinitions.set(card.id, {
          id: card.id,
          name: card.name,
          description: card.description,
          effectType: String(card.effect_type),
          value: Number(card.effect_value),
        });
      }
    }

    const itemIds = items.map(item => item.id);
    const { data: purchases, error: purchasesError } = await client
      .from('purchases')
      .select('shop_item_id,quantity')
      .eq('user_id', userId)
      .in('shop_item_id', itemIds);
    if (purchasesError) throw new Error(`Supabase shop purchases select: ${purchasesError.message}`);

    const { data: cards, error: cardsError } = await client
      .from('user_cards')
      .select('card_id,quantity')
      .eq('user_id', userId);
    if (cardsError) throw new Error(`Supabase shop inventory select: ${cardsError.message}`);

    const purchaseCounts = new Map<string, number>();
    for (const purchase of purchases ?? []) {
      purchaseCounts.set(
        purchase.shop_item_id,
        (purchaseCounts.get(purchase.shop_item_id) ?? 0) + Number(purchase.quantity),
      );
    }
    const cardCounts = new Map<string, number>();
    for (const card of cards ?? []) {
      cardCounts.set(card.card_id, (cardCounts.get(card.card_id) ?? 0) + Number(card.quantity));
    }

    return (items ?? []).map(item => {
      const itemType = String(item.item_type);
      const ownedQuantity = itemType === 'CARD' && item.reference_id
        ? cardCounts.get(item.reference_id) ?? 0
        : itemType === 'SKIN' ? purchaseCounts.get(item.id) ?? 0 : 0;
      return {
        id: item.id,
        name: item.name,
        description: item.description ?? cardDefinitions.get(item.reference_id)?.description ?? '',
        itemType,
        referenceId: item.reference_id,
        price: Number(item.price),
        currencyType: String(item.currency_type),
        stock: item.stock === null ? null : Number(item.stock),
        isActive: item.is_active,
        ownedQuantity,
        isOwned: ownedQuantity > 0,
        canPurchaseMultiple: item.is_repeatable,
        rewardCurrency: Number(item.reward_currency ?? 0),
        rewardGems: Number(item.reward_gems ?? 0),
        card: itemType === 'CARD' && item.reference_id
          ? cardDefinitions.get(item.reference_id) ?? null
          : null,
      };
    });
  }

  async purchaseShopItem(input: {
    userId: string;
    itemId: string;
    quantity: number;
    idempotencyKey: string;
  }) {
    const { data, error } = await this.adminClient().rpc('purchase_shop_item', {
      p_user_id: input.userId,
      p_item_id: input.itemId,
      p_quantity: input.quantity,
      p_idempotency_key: input.idempotencyKey,
    });
    if (error) throw new Error(`Supabase shop purchase: ${error.message}`);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) throw new Error('Supabase shop purchase did not return a result');
    return result as {
      purchase_id: string;
      item_id: string;
      item_name: string;
      item_type: string;
      reference_id: string | null;
      quantity: number;
      total_price: number | string;
      currency_type: string;
      replayed: boolean;
      wallet_currency: number | string;
      wallet_gems: number | string;
      owned_quantity: number | string;
      card_quantity: number | string;
      reward_currency: number | string;
      reward_gems: number | string;
      card_name: string | null;
      card_description: string | null;
      card_effect_type: string | null;
      card_effect_value: number | null;
    };
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
