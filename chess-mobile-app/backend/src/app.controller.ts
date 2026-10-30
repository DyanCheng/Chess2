import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './database/supabase.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly supabase: SupabaseService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get('health')
  healthCheck(): string {
    return 'Chess Backend is healthy!';
  }

  @Get('health/database')
  async databaseHealthCheck() {
    try {
      await this.supabase.checkConnection();
      return { status: 'connected' };
    } catch {
      throw new ServiceUnavailableException('Supabase chưa sẵn sàng; kiểm tra biến môi trường và migration');
    }
  }
}
