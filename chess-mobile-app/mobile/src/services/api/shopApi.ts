import { apiService } from './apiService';

export const shopApi = {
  getItems: () => apiService.getShopItems(),
  purchaseItem: (itemId: string, quantity: number, idempotencyKey: string) =>
    apiService.purchaseItem(itemId, quantity, idempotencyKey),
  getOwnedCards: () => apiService.getOwnedCards(),
  getAllCards: () => apiService.getAllCards(),
};
