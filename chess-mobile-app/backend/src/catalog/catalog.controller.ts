import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Controller('modes')
export class CatalogController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async modes() {
    const catalog = await this.supabase.getModeCatalog();
    return {
      modes: catalog.modes.map(mode => ({
        id: mode.id,
        code: mode.code,
        name: mode.name,
        description: mode.description,
        rules: mode.rules,
        sortOrder: mode.sort_order,
        demoPreview: null,
      })),
      season: catalog.season ? {
        id: catalog.season.id,
        name: catalog.season.name,
        startAt: catalog.season.start_at,
        endAt: catalog.season.end_at,
      } : null,
    };
  }
}
