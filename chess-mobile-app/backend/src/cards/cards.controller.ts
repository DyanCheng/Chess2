import { Controller, Get, Headers } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
import { CardsService } from './cards.service';

@Controller('cards')
export class CardsController {
  constructor(private readonly auth: AuthService, private readonly cards: CardsService) {}

  private async userId(authorization?: string) {
    const user = await this.auth.getUser(accessTokenFromHeader(authorization));
    return user.id;
  }

  @Get('all')
  async all(@Headers('authorization') authorization?: string) {
    await this.userId(authorization);
    return { cards: await this.cards.listAll() };
  }

  @Get('owned')
  async owned(@Headers('authorization') authorization?: string) {
    return { cards: await this.cards.listOwned(await this.userId(authorization)) };
  }
}
