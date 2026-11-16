import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

export interface ShopPurchaseRequest {
  itemId: string;
  quantity: number;
  idempotencyKey: string;
}

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getActiveItems(userId: string) {
    try {
      return await this.supabase.getActiveShopItems(userId);
    } catch (error) {
      this.logger.error(
        `Unable to load shop catalog: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new ServiceUnavailableException('Không thể tải cửa hàng');
    }
  }

  async purchase(userId: string, request: ShopPurchaseRequest) {
    try {
      const result = await this.supabase.purchaseShopItem({
        userId,
        itemId: request.itemId,
        quantity: request.quantity,
        idempotencyKey: request.idempotencyKey,
      });

      return {
        purchase: {
          id: result.purchase_id,
          itemId: result.item_id,
          itemName: result.item_name,
          itemType: result.item_type,
          referenceId: result.reference_id,
          quantity: Number(result.quantity),
          totalPrice: Number(result.total_price),
          currencyType: result.currency_type,
          replayed: result.replayed,
        },
        wallet: {
          gold: Number(result.wallet_currency),
          gems: Number(result.wallet_gems),
        },
        inventory: {
          itemId: result.item_id,
          ownedQuantity: Number(result.owned_quantity),
          cardId: result.item_type === 'CARD' ? result.reference_id : null,
          cardQuantity: Number(result.card_quantity),
          card: result.item_type === 'CARD' && result.reference_id && result.card_name
            ? {
                id: result.reference_id,
                name: result.card_name,
                description: result.card_description ?? '',
                effectType: result.card_effect_type ?? '',
                value: Number(result.card_effect_value ?? 0),
                quantity: Number(result.card_quantity),
              }
            : null,
        },
        rewards: {
          gold: Number(result.reward_currency),
          gems: Number(result.reward_gems),
        },
      };
    } catch (error) {
      if (!(error instanceof Error)) {
        this.logger.error('Shop purchase failed with a non-Error value');
        throw new InternalServerErrorException('Không thể xử lý giao dịch mua hàng');
      }

      const message = error.message;
      if (message.includes('INVALID_QUANTITY') || message.includes('INVALID_IDEMPOTENCY_KEY')) {
        throw new BadRequestException('Số lượng hoặc mã giao dịch không hợp lệ');
      }
      if (message.includes('ITEM_NOT_FOUND')) {
        throw new NotFoundException('Vật phẩm không tồn tại');
      }
      if (message.includes('WALLET_NOT_FOUND')) {
        throw new NotFoundException('Không tìm thấy ví người chơi');
      }
      if (message.includes('INSUFFICIENT_FUNDS')) {
        throw new BadRequestException('Không đủ số dư để mua vật phẩm');
      }
      if (message.includes('ALREADY_OWNED')) {
        throw new ConflictException('Bạn đã sở hữu vật phẩm này');
      }
      if (
        message.includes('IDEMPOTENCY_KEY_REUSED') ||
        message.includes('ITEM_INACTIVE') ||
        message.includes('OUT_OF_STOCK') ||
        message.includes('INVALID_CARD_REFERENCE') ||
        message.includes('INVALID_ITEM_REWARD') ||
        message.includes('UNSUPPORTED_ITEM_TYPE') ||
        message.includes('UNSUPPORTED_CURRENCY')
      ) {
        throw new ConflictException('Vật phẩm hoặc yêu cầu giao dịch không còn hợp lệ');
      }

      this.logger.error(`Shop purchase failed: ${message}`);
      throw new InternalServerErrorException('Không thể xử lý giao dịch mua hàng');
    }
  }
}