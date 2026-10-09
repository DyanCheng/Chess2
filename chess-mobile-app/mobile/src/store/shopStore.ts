// ============================================================
// Shop Store - Shop items and transactions
// ============================================================

import { create } from 'zustand';
import { PieceSkin } from '../types/chess';

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
}

interface ShopStore {
  items: ShopItem[];
  featuredItems: ShopItem[];
  selectedCategory: string;
  isLoading: boolean;

  setCategory: (category: string) => void;
  purchaseItem: (itemId: string) => boolean;
  refreshShop: () => void;
}

const MOCK_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'skin_royal',
    name: 'Bộ Hoàng Gia',
    description: 'Quân cờ phong cách hoàng gia sang trọng',
    category: 'skin',
    price: 500,
    currencyType: 'gems',
    imageUrl: 'skin_royal',
    rarity: 'legendary',
    isOwned: false,
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'skin_neon',
    name: 'Neon Cyber',
    description: 'Quân cờ phong cách cyberpunk neon',
    category: 'skin',
    price: 300,
    currencyType: 'gems',
    imageUrl: 'skin_neon',
    rarity: 'epic',
    isOwned: false,
    isNew: true,
  },
  {
    id: 'skin_wood',
    name: 'Gỗ Cổ Điển',
    description: 'Quân cờ gỗ phong cách truyền thống',
    category: 'skin',
    price: 1000,
    currencyType: 'gold',
    imageUrl: 'skin_wood',
    rarity: 'common',
    isOwned: false,
  },
  {
    id: 'skin_crystal',
    name: 'Pha Lê Kỳ Diệu',
    description: 'Quân cờ pha lê phát sáng huyền ảo',
    category: 'skin',
    price: 400,
    currencyType: 'gems',
    imageUrl: 'skin_crystal',
    rarity: 'epic',
    isOwned: false,
  },
  {
    id: 'bundle_starter',
    name: 'Gói Khởi Đầu',
    description: '500 Vàng + 50 Kim cương + 2 Thẻ ngẫu nhiên',
    category: 'bundle',
    price: 199,
    currencyType: 'real',
    imageUrl: 'bundle_starter',
    rarity: 'rare',
    isOwned: false,
    isFeatured: true,
    discount: 30,
  },
  {
    id: 'bundle_pro',
    name: 'Gói Chiến Binh',
    description: '2000 Vàng + 200 Kim cương + 5 Thẻ Epic',
    category: 'bundle',
    price: 499,
    currencyType: 'real',
    imageUrl: 'bundle_pro',
    rarity: 'epic',
    isOwned: false,
    isFeatured: true,
    discount: 25,
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
  },
];

export const useShopStore = create<ShopStore>()((set, get) => ({
  items: MOCK_SHOP_ITEMS,
  featuredItems: MOCK_SHOP_ITEMS.filter(i => i.isFeatured),
  selectedCategory: 'all',
  isLoading: false,

  setCategory: (category) => set({ selectedCategory: category }),

  purchaseItem: (itemId) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item || item.isOwned) return false;

    set(state => ({
      items: state.items.map(i =>
        i.id === itemId ? { ...i, isOwned: true } : i
      ),
    }));
    return true;
  },

  refreshShop: () => {
    set({ isLoading: true });
    setTimeout(() => set({ isLoading: false }), 500);
  },
}));
