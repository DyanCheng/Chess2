// ============================================================
// API Service - REST API client
// ============================================================

const BASE_URL = 'http://localhost:3000/api'; // TODO: Replace with actual backend URL

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (error: any) {
      return { data: null, error: error.message, status: 0 };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('POST', '/auth/login', { email, password });
  }

  async register(email: string, password: string, username: string) {
    return this.request('POST', '/auth/register', { email, password, username });
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

  // Game endpoints
  async getGameHistory(page: number = 1, limit: number = 20) {
    return this.request('GET', `/games/history?page=${page}&limit=${limit}`);
  }

  async getGameDetails(gameId: string) {
    return this.request('GET', `/games/${gameId}`);
  }

  // Shop endpoints
  async getShopItems() {
    return this.request('GET', '/shop/items');
  }

  async purchaseItem(itemId: string) {
    return this.request('POST', '/shop/purchase', { itemId });
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
