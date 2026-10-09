import { apiService } from './apiService';

export const historyApi = {
  getHistory: (page: number = 1, limit: number = 20) => apiService.getGameHistory(page, limit),
  getGameDetails: (gameId: string) => apiService.getGameDetails(gameId),
  getStats: () => apiService.getStats(),
  getLeaderboard: (limit: number = 50) => apiService.getLeaderboard(limit),
};
