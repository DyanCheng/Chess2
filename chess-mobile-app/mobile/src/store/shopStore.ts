// ============================================================
// Shop Store - Shop items and transactions
// ============================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShopCatalogItem } from '../services/api/apiService';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'card' | 'skin' | 'bundle' | 'currency';
  price: number;
  currencyType: 'gold' | 'gems' | 'real';
  imageUrl: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  isOwned: boolean;
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  storeProductId?: string;
  localizedPrice?: string;
  referenceId?: string | null;
  ownedQuantity?: number;
  canPurchaseMultiple?: boolean;
  stock?: number | null;
  isActive?: boolean;
  rewardCurrency?: number;
  rewardGems?: number;
  card?: ShopCatalogItem['card'];
}

interface ShopStore {
  items: ShopItem[];
  featuredItems: ShopItem[];
  selectedCategory: string;
  isLoading: boolean;

  setCategory: (category: string) => void;
  setServerItems: (items: ShopCatalogItem[]) => void;
  applyPurchase: (itemId: string, ownedQuantity: number) => void;
  setStorePrices: (prices: Record<string, string>) => void;
  setLoading: (isLoading: boolean) => void;
  refreshShop: () => void;
}

const IAP_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'bundle_starter',
    name: 'Gói Khởi Đầu',
    description: '500 Vàng + 50 Kim cương',
    category: 'bundle',
    price: 199,
    currencyType: 'real',
    imageUrl: 'bundle_starter',
    rarity: 'rare',
    isOwned: false,
    isFeatured: true,
    discount: 30,
    storeProductId: 'arcane_chess_starter_bundle',
  },
  {
    id: 'bundle_pro',
    name: 'Gói Chiến Binh',
    description: '2000 Vàng + 200 Kim cương',
    category: 'bundle',
    price: 499,
    currencyType: 'real',
    imageUrl: 'bundle_pro',
    rarity: 'epic',
    isOwned: false,
    isFeatured: true,
    discount: 25,
    storeProductId: 'arcane_chess_pro_bundle',
  },
  {
    id: 'gold_1000',
    name: '1000 Vàng',
    description: 'Gói 1000 vàng',
    category: 'currency',
    price: 99,
    currencyType: 'real',
    imageUrl: 'gold_pack',
    isOwned: false,
    storeProductId: 'arcane_chess_gold_1000',
  },
  {
    id: 'gems_100',
    name: '100 Kim Cương',
    description: 'Gói 100 kim cương',
    category: 'currency',
    price: 199,
    currencyType: 'real',
    imageUrl: 'gem_pack',
    isOwned: false,
    storeProductId: 'arcane_chess_gems_100',
  },
];

export const useShopStore = create<ShopStore>()(persist((set, get) => ({
  items: IAP_SHOP_ITEMS,
  featuredItems: IAP_SHOP_ITEMS.filter(i => i.isFeatured),
  selectedCategory: 'all',
  isLoading: false,

  setCategory: (category) => set({ selectedCategory: category }),

  setServerItems: (serverItems) => set(state => {
    const localizedPrices = new Map(
      state.items
        .filter(item => item.storeProductId && item.localizedPrice)
        .map(item => [item.storeProductId as string, item.localizedPrice as string]),
    );
    const mappedItems: ShopItem[] = serverItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.itemType === 'CARD'
        ? 'card'
        : item.itemType === 'SKIN' ? 'skin' : 'currency',
      price: item.price,
      currencyType: item.currencyType === 'GEM' ? 'gems' : 'gold',
      imageUrl: item.referenceId || item.id,
      isOwned: item.isOwned,
      ownedQuantity: item.ownedQuantity,
      canPurchaseMultiple: item.canPurchaseMultiple,
      referenceId: item.referenceId,
      stock: item.stock,
      isActive: item.isActive,
      rewardCurrency: item.rewardCurrency,
      rewardGems: item.rewardGems,
      card: item.card,
    }));
    const iapItems = IAP_SHOP_ITEMS.map(item => ({
      ...item,
      localizedPrice: item.storeProductId
        ? localizedPrices.get(item.storeProductId)
        : undefined,
    }));
    const items = [...mappedItems, ...iapItems];
    return { items, featuredItems: items.filter(item => item.isFeatured) };
  }),

  applyPurchase: (itemId, ownedQuantity) => set(state => {
    const items = state.items.map(item => item.id === itemId
      ? { ...item, ownedQuantity, isOwned: ownedQuantity > 0 }
      : item);
    return { items, featuredItems: items.filter(item => item.isFeatured) };
  }),

  setStorePrices: (prices) => set(state => {
    const items = state.items.map(item => ({
      ...item,
      localizedPrice: item.storeProductId ? prices[item.storeProductId] : undefined,
    }));
    return { items, featuredItems: items.filter(item => item.isFeatured) };
  }),

  setLoading: (isLoading) => set({ isLoading }),

  refreshShop: () => {
    set({ isLoading: true });
    setTimeout(() => set({ isLoading: false }), 500);
  },
}), {
  name: 'arcane-shop-v1',
  storage: createJSONStorage(() => AsyncStorage),
}));
