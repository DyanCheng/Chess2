import { apiService } from './apiService';

export interface CreateGameParams {
  mode: 'pvp' | 'pve';
  botId?: string;
  timeControl?: number;
}

export const gameApi = {
  createGame: (params: CreateGameParams) => {
    return apiService.getGameHistory(); // stub or backend call
  },
  getGameDetails: (gameId: string) => apiService.getGameDetails(gameId),
  getGameHistory: (page: number = 1, limit: number = 20) => apiService.getGameHistory(page, limit),
};
