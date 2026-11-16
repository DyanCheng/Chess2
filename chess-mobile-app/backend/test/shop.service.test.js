const test = require('node:test');
const assert = require('node:assert/strict');
const { BadRequestException, ConflictException, NotFoundException } = require('@nestjs/common');
const { ShopController } = require('../dist/shop/shop.controller');
const { ShopService } = require('../dist/shop/shop.service');

const request = {
  itemId: '11000000-0000-4000-8000-000000000001',
  quantity: 1,
  idempotencyKey: 'shop-test-key',
};

const successResult = {
  purchase_id: 'purchase-id',
  item_id: request.itemId,
  item_name: 'Skin',
  item_type: 'SKIN',
  reference_id: null,
  quantity: 1,
  total_price: '500',
  currency_type: 'GEM',
  replayed: false,
  wallet_currency: '1000',
  wallet_gems: '250',
  owned_quantity: '1',
  card_quantity: '0',
  reward_currency: '0',
  reward_gems: '0',
  card_name: null,
  card_description: null,
  card_effect_type: null,
  card_effect_value: null,
};

test('shop purchase uses the authenticated user and only client purchase fields', async () => {
  let call;
  const auth = { getUser: async token => ({ id: token === 'verified-token' ? 'verified-user' : 'wrong-user' }) };
  const shop = {
    purchase: async (userId, body) => {
      call = { userId, body };
      return { accepted: true };
    },
  };
  const controller = new ShopController(auth, shop);

  await controller.purchase('Bearer verified-token', {
    item_id: request.itemId,
    quantity: 1,
    idempotency_key: request.idempotencyKey,
    user_id: 'untrusted-user',
  });

  assert.deepEqual(call, {
    userId: 'verified-user',
    body: request,
  });
});

test('shop purchase returns backend wallet and inventory values', async () => {
  const service = new ShopService({
    purchaseShopItem: async input => {
      assert.deepEqual(input, {
        userId: 'authenticated-user',
        itemId: request.itemId,
        quantity: 1,
        idempotencyKey: request.idempotencyKey,
      });
      return successResult;
    },
  });

  const response = await service.purchase('authenticated-user', request);
  assert.deepEqual(response.wallet, { gold: 1000, gems: 250 });
  assert.deepEqual(response.inventory, {
    itemId: request.itemId,
    ownedQuantity: 1,
    cardId: null,
    cardQuantity: 0,
    card: null,
  });
  assert.equal(response.purchase.totalPrice, 500);
});

test('shop maps expected database transaction failures to API errors', async t => {
  const cases = [
    ['INSUFFICIENT_FUNDS', BadRequestException, 400],
    ['ITEM_NOT_FOUND', NotFoundException, 404],
    ['ALREADY_OWNED', ConflictException, 409],
    ['IDEMPOTENCY_KEY_REUSED', ConflictException, 409],
  ];

  for (const [message, exception, status] of cases) {
    await t.test(message, async () => {
      const service = new ShopService({
        purchaseShopItem: async () => { throw new Error(message); },
      });
      await assert.rejects(
        service.purchase('authenticated-user', request),
        error => error instanceof exception && error.getStatus() === status,
      );
    });
  }
});
