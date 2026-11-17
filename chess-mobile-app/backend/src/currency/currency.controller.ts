import { Controller, Get, Headers } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly auth: AuthService, private readonly currency: CurrencyService) {}

  @Get('balance')
  async balance(@Headers('authorization') authorization?: string) {
    const user = await this.auth.getUser(accessTokenFromHeader(authorization));
    return this.currency.getBalance(user.id);
  }
}
