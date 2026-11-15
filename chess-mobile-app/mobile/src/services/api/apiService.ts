// ============================================================
// API Service - REST API client
// ============================================================

import { serverConfig } from '../serverConfig';
import { LeaderboardEntry } from '../../types/player';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface AuthSessionResponse {
  user: { id: string; email: string; username: string };
  accessToken: string | null;
  refreshToken: string | null;
  emailConfirmationRequired?: boolean;
}

export interface GameModeDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  rules: Record<string, unknown> | null;
  sortOrder: number;
  demoPreview: {
    displayName: string;
    avatarUrl: string | null;
    rankPoints: number;
    tierCode: string;
    tierName: string;
    wins: number;
    losses: number;
    draws: number;
  } | null;
}

export interface RankScreenData {
  season: {
    id: string;
    name: string;
    startAt: string;
    endAt: string;
  };
  rank: {
    id: string;
    rankPoints: number;
    wins: number;
    losses: number;
    draws: number;
    updatedAt: string;
    tier: {
      id: string;
      code: string;
      name: string;
      minPoints: number;
      order: number;
    };
  };
  history: Array<{
    id: string;
    matchId: string | null;
    pointsBefore: number;
    pointsChange: number;
    pointsAfter: number;
    createdAt: string;
  }>;
}

export interface ModeCatalogResponse {
  modes: GameModeDefinition[];
  season: RankScreenData['season'] | null;
}

export interface IapProductDefinition {
  productId: string;
  gold: number;
  gems: number;
}

export interface WalletResponse {
  gold: number;
  gems: number;
  updatedAt: string;
}

export interface IapSyncResponse {
  creditedPurchases: number;
  wallet: WalletResponse;
}

export interface ShopCatalogItem {
  id: string;
  name: string;
  description: string;
  itemType: 'CARD' | 'SKIN' | 'CURRENCY_PACK';
  referenceId: string | null;
  price: number;
  currencyType: 'GOLD' | 'GEM';
  stock: number | null;
  isActive: boolean;
  ownedQuantity: number;
  isOwned: boolean;
  canPurchaseMultiple: boolean;
  rewardCurrency: number;
  rewardGems: number;
  card: {
    id: string;
    name: string;
    description: string | null;
    effectType: string;
    value: number;
  } | null;
}

export interface ShopPurchaseResponse {
  purchase: {
    id: string;
    itemId: string;
    itemName: string;
    itemType: ShopCatalogItem['itemType'];
    referenceId: string | null;
    quantity: number;
    totalPrice: number;
    currencyType: ShopCatalogItem['currencyType'];
    replayed: boolean;
  };
  wallet: {
    gold: number;
    gems: number;
  };
  inventory: {
    itemId: string;
    ownedQuantity: number;
    cardId: string | null;
    cardQuantity: number;
    card: {
      id: string;
      name: string;
      description: string;
      effectType: string;
      value: number;
      quantity: number;
    } | null;
  };
  rewards: {
    gold: number;
    gems: number;
  };
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const baseUrl = await serverConfig.getUrl();
      if (!baseUrl) return { data: null, error: 'Chưa cấu hình máy chủ trong Cài đặt', status: 0 };
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return { data: response.ok ? data : null, error: response.ok ? null : data?.message || `HTTP ${response.status}`, status: response.status };
    } catch (error: any) {
      return { data: null, error: error.message, status: 0 };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<AuthSessionResponse>('POST', '/auth/login', { email, password });
  }

  async register(email: string, password: string, username: string) {
    return this.request<AuthSessionResponse>('POST', '/auth/register', { email, password, username });
  }

  async refreshSession(refreshToken: string) {
    return this.request<AuthSessionResponse>('POST', '/auth/refresh', { refreshToken });
  }

  // Player endpoints
  async getProfile() {
    return this.request('GET', '/player/profile');
  }

  async updateProfile(data: any) {
    return this.request('PUT', '/player/profile', data);
  }

  async getStats() {
    return this.request('GET', '/player/stats');
  }

  async getLeaderboard(limit: number = 50) {
    return this.request<LeaderboardEntry[]>('GET', `/player/leaderboard?limit=${limit}`);
  }

  async getActiveModes() {
    return this.request<ModeCatalogResponse>('GET', '/modes');
  }

  async getMyRank() {
    return this.request<RankScreenData>('GET', '/rank/me');
  }

  // Game endpoints. New PvP games are created by the authenticated
  // Socket.IO matchmaking flow, not by a client-controlled REST payload.
  async getGameHistory(page: number = 1, limit: number = 20) {
    return this.request<{ matches: Array<{
      id: string; status: string; winner_id: string | null; created_at: string;
      match_players: Array<{ user_id: string; color: 'WHITE' | 'BLACK' }>;
    }> }>('GET', `/matches/history?page=${page}&limit=${limit}`);
  }

  async getGameDetails(gameId: string) {
    return this.request('GET', `/game/${gameId}`);
  }

  // Shop endpoints
  async getShopItems() {
    return this.request<{ items: ShopCatalogItem[] }>('GET', '/shop/items');
  }

  async purchaseItem(itemId: string, quantity: number, idempotencyKey: string) {
    return this.request<ShopPurchaseResponse>('POST', '/shop/purchase', {
      item_id: itemId,
      quantity,
      idempotency_key: idempotencyKey,
    });
  }

  async getIapProducts() {
    return this.request<{ products: IapProductDefinition[] }>('GET', '/iap/products');
  }

  async getWallet() {
    return this.request<WalletResponse>('GET', '/iap/wallet');
  }

  async syncIapPurchases() {
    return this.request<IapSyncResponse>('POST', '/iap/sync');
  }

  // Card endpoints
  async getOwnedCards() {
    return this.request('GET', '/cards/owned');
  }

  async getAllCards() {
    return this.request('GET', '/cards/all');
  }
}

export const apiService = new ApiService();
