import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class CardsService {
  constructor(private readonly supabase: SupabaseService) {}

  listAll() {
    return this.supabase.listFunctionCards();
  }

  listOwned(userId: string) {
    return this.supabase.listOwnedCards(userId);
  }
}
