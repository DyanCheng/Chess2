import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class CurrencyService {
  constructor(private readonly supabase: SupabaseService) {}

  async getBalance(userId: string) {
    const wallet = await this.supabase.getWallet(userId);
    return {
      gold: Number(wallet.currency),
      gems: Number(wallet.gems),
      updatedAt: wallet.updated_at,
    };
  }
}
