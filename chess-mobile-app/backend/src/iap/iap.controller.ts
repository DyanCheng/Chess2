import { Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
import { IapService } from './iap.service';

@Controller('iap')
export class IapController {
  constructor(
    private readonly auth: AuthService,
    private readonly iap: IapService,
  ) {}

  private async userId(authorization?: string) {
    const user = await this.auth.getUser(accessTokenFromHeader(authorization));
    return user.id;
  }

  @Get('products')
  async products(@Headers('authorization') authorization?: string) {
    await this.userId(authorization);
    return { products: this.iap.listProducts() };
  }

  @Get('wallet')
  async wallet(@Headers('authorization') authorization?: string) {
    const userId = await this.userId(authorization);
    const wallet = await this.iap.getWallet(userId);
    return {
      gold: Number(wallet.currency),
      gems: Number(wallet.gems),
      updatedAt: wallet.updated_at,
    };
  }

  @Post('sync')
  async sync(@Headers('authorization') authorization?: string) {
    return this.iap.syncPurchases(await this.userId(authorization));
  }
}
