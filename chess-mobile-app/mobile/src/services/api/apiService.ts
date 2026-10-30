// ============================================================
// API Service - REST API client
// ============================================================

import { serverConfig } from '../serverConfig';

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

export interface OwnedCardDefinition {
  id: string;
  quantity: number;
  name: string;
  description: string | null;
  effectType: 'HEAL' | 'DOUBLE_DAMAGE';
  effectValue: number;
  active: boolean;
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
    return this.request('GET', `/player/leaderboard?limit=${limit}`);
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
    return this.request('GET', '/shop/items');
  }

  async purchaseItem(itemId: string) {
    return this.request('POST', '/shop/purchase', { itemId });
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
    return this.request<{ cards: OwnedCardDefinition[] }>('GET', '/cards/owned');
  }

  async getAllCards() {
    return this.request('GET', '/cards/all');
  }
}

export const apiService = new ApiService();
