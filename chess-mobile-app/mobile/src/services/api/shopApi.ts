import { apiService } from './apiService';

export const shopApi = {
  getItems: () => apiService.getShopItems(),
  purchaseItem: (itemId: string) => apiService.purchaseItem(itemId),
  getOwnedCards: () => apiService.getOwnedCards(),
  getAllCards: () => apiService.getAllCards(),
};
