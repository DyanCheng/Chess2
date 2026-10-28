const test = require('node:test');
const assert = require('node:assert/strict');
const { IapService } = require('../dist/iap/iap.service');

test('IAP sync credits only server-defined RevenueCat products', async t => {
  const previousSecret = process.env.REVENUECAT_SECRET_API_KEY;
  const previousFetch = global.fetch;
  process.env.REVENUECAT_SECRET_API_KEY = 'sk_test_only';
  t.after(() => {
    if (previousSecret === undefined) delete process.env.REVENUECAT_SECRET_API_KEY;
    else process.env.REVENUECAT_SECRET_API_KEY = previousSecret;
    global.fetch = previousFetch;
  });

  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      subscriber: {
        non_subscriptions: {
          arcane_chess_gold_1000: [
            { id: 'google-1', purchase_date: '2026-10-28T00:00:00Z', store: 'play_store', is_sandbox: true },
          ],
          unknown_client_product: [
            { id: 'google-2', purchase_date: '2026-10-28T00:00:00Z', store: 'play_store', is_sandbox: true },
          ],
        },
      },
    }),
  });

  const credits = [];
  const service = new IapService({
    creditIapPurchase: async input => {
      credits.push(input);
      return { credited: true, currency: 1000, gems: 0 };
    },
    getWallet: async () => ({ currency: 1000, gems: 0, updated_at: '2026-10-28T00:00:01Z' }),
  });

  const result = await service.syncPurchases('11111111-1111-4111-8111-111111111111');
  assert.equal(credits.length, 1);
  assert.equal(credits[0].transactionId, 'google-1');
  assert.equal(credits[0].goldDelta, 1000);
  assert.equal(credits[0].gemsDelta, 0);
  assert.equal(credits[0].environment, 'SANDBOX');
  assert.equal(result.creditedPurchases, 1);
  assert.deepEqual(result.wallet, {
    gold: 1000,
    gems: 0,
    updatedAt: '2026-10-28T00:00:01Z',
  });
});

test('IAP sync refuses to run without a backend RevenueCat secret', async t => {
  const previousSecret = process.env.REVENUECAT_SECRET_API_KEY;
  delete process.env.REVENUECAT_SECRET_API_KEY;
  t.after(() => {
    if (previousSecret !== undefined) process.env.REVENUECAT_SECRET_API_KEY = previousSecret;
  });

  const service = new IapService({});
  await assert.rejects(
    () => service.syncPurchases('11111111-1111-4111-8111-111111111111'),
    error => error.getStatus() === 503,
  );
});
