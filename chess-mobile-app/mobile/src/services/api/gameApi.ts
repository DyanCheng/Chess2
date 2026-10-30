import { apiService } from './apiService';

export const gameApi = {
  getGameDetails: (gameId: string) => apiService.getGameDetails(gameId),
  getGameHistory: (page: number = 1, limit: number = 20) => apiService.getGameHistory(page, limit),
};
