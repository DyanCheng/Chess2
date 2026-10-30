import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

export const IAP_PRODUCTS = {
  arcane_chess_gold_1000: { gold: 1000, gems: 0 },
  arcane_chess_gems_100: { gold: 0, gems: 100 },
  arcane_chess_starter_bundle: { gold: 500, gems: 50 },
  arcane_chess_pro_bundle: { gold: 2000, gems: 200 },
} as const;

interface RevenueCatTransaction {
  id?: string;
  is_sandbox?: boolean;
  purchase_date?: string;
  store?: string;
}

interface RevenueCatCustomerResponse {
  subscriber?: {
    non_subscriptions?: Record<string, RevenueCatTransaction[]>;
  };
}

@Injectable()
export class IapService {
  private readonly revenueCatSecret = process.env.REVENUECAT_SECRET_API_KEY?.trim();

  constructor(private readonly supabase: SupabaseService) {}

  listProducts() {
    return Object.entries(IAP_PRODUCTS).map(([productId, reward]) => ({
      productId,
      ...reward,
    }));
  }

  getWallet(userId: string) {
    return this.supabase.getWallet(userId);
  }

  async syncPurchases(userId: string) {
    if (!this.revenueCatSecret) {
      throw new ServiceUnavailableException(
        'Backend chưa cấu hình REVENUECAT_SECRET_API_KEY',
      );
    }

    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${this.revenueCatSecret}`,
          Accept: 'application/json',
        },
      },
    );
    if (!response.ok) {
      throw new BadGatewayException(
        `RevenueCat verification failed with HTTP ${response.status}`,
      );
    }

    const customer = await response.json() as RevenueCatCustomerResponse;
    const purchases = customer.subscriber?.non_subscriptions ?? {};
    let creditedPurchases = 0;

    for (const [productId, transactions] of Object.entries(purchases)) {
      const reward = IAP_PRODUCTS[productId as keyof typeof IAP_PRODUCTS];
      if (!reward) continue;

      for (const transaction of transactions ?? []) {
        if (!transaction.id || !transaction.purchase_date) continue;
        const result = await this.supabase.creditIapPurchase({
          userId,
          store: (transaction.store || 'UNKNOWN').toUpperCase(),
          transactionId: transaction.id,
          productId,
          environment: transaction.is_sandbox ? 'SANDBOX' : 'PRODUCTION',
          goldDelta: reward.gold,
          gemsDelta: reward.gems,
          purchasedAt: transaction.purchase_date,
        });
        if (result.credited) creditedPurchases += 1;
      }
    }

    const wallet = await this.supabase.getWallet(userId);
    return {
      creditedPurchases,
      wallet: {
        gold: Number(wallet.currency),
        gems: Number(wallet.gems),
        updatedAt: wallet.updated_at,
      },
    };
  }
}
