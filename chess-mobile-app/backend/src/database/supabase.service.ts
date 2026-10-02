import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  public client: SupabaseClient;

  constructor() {
    this.client = createClient(
      'https://uypkftuongspbjvzsuer.supabase.co',
      'sb_publishable_tpfmS2TrbvN9OZHh0c5Slg_8nrR4Wmg'
    );
  }
}