import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';
import { ShopService } from './shop.service';

interface PurchaseShopItemBody {
  item_id: string;
  quantity: number;
  idempotency_key: string;
}

@Controller('shop')
export class ShopController {
  constructor(
    private readonly auth: AuthService,
    private readonly shop: ShopService,
  ) {}

  private async userId(authorization?: string) {
    const user = await this.auth.getUser(accessTokenFromHeader(authorization));
    return user.id;
  }

  @Get('items')
  async items(@Headers('authorization') authorization?: string) {
    return {
      items: await this.shop.getActiveItems(await this.userId(authorization)),
    };
  }

  @Post('purchase')
  async purchase(
    @Headers('authorization') authorization: string,
    @Body() body: PurchaseShopItemBody,
  ) {
    if (
      !body ||
      typeof body.item_id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.item_id) ||
      !Number.isInteger(body.quantity) ||
      body.quantity < 1 ||
      body.quantity > 99 ||
      typeof body.idempotency_key !== 'string' ||
      body.idempotency_key.length < 8 ||
      body.idempotency_key.length > 128 ||
      !/^[A-Za-z0-9._:-]+$/.test(body.idempotency_key)
    ) {
      throw new BadRequestException('Dữ liệu giao dịch không hợp lệ');
    }

    return this.shop.purchase(await this.userId(authorization), {
      itemId: body.item_id,
      quantity: body.quantity,
      idempotencyKey: body.idempotency_key,
    });
  }
}