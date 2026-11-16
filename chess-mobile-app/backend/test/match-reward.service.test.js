const test = require('node:test');
const assert = require('node:assert/strict');
const { MatchRewardService } = require('../dist/game/match-reward.service');
const { GameService } = require('../dist/game/game.service');

const winnerId = 'winner-user';
const loserId = 'loser-user';

function createService({ status = 'FINISHED', winner = winnerId, rpc } = {}) {
  const calls = [];
  const match = { status, winner_id: winner };
  const client = {
    from(table) {
      const query = {
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => ({ data: match, error: null }),
        then(resolve, reject) {
          const data = table === 'match_players'
            ? [{ user_id: winnerId }, { user_id: loserId }]
            : match;
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
    rpc: async (name, args) => {
      calls.push({ name, args });
      return rpc ? rpc(name, args, calls.length) : {
        data: [{ credited: true, currency: args.p_currency_amount, experience: args.p_experience_amount }],
        error: null,
      };
    },
  };
  const service = new MatchRewardService({ adminClient: () => client });
  const logs = [];
  service.logger.error = message => logs.push(message);
  return { service, calls, logs };
}

test('finished match credits winner and loser using the existing PVP policy', async () => {
  const { service, calls } = createService();
  const results = await service.creditFinishedMatch('match-id');

  assert.deepEqual(calls.map(call => call.args), [
    {
      p_match_id: 'match-id',
      p_user_id: winnerId,
      p_currency_amount: 30,
      p_experience_amount: 25,
      p_card_id: null,
      p_card_quantity: 0,
    },
    {
      p_match_id: 'match-id',
      p_user_id: loserId,
      p_currency_amount: 5,
      p_experience_amount: 10,
      p_card_id: null,
      p_card_quantity: 0,
    },
  ]);
  assert.deepEqual(results.map(result => result.status), ['credited', 'credited']);
});

test('draw applies the existing draw reward to both players', async () => {
  const { service, calls } = createService({ status: 'DRAW', winner: null });
  await service.creditFinishedMatch('draw-match');

  assert.equal(calls.length, 2);
  assert.ok(calls.every(({ args }) =>
    args.p_currency_amount === 15 && args.p_experience_amount === 15));
});

test('cancelled match is not rewarded', async () => {
  const { service, calls } = createService({ status: 'CANCELLED', winner: null });
  assert.deepEqual(await service.creditFinishedMatch('cancelled-match'), []);
  assert.equal(calls.length, 0);
});

test('reprocessing a finished match uses RPC idempotency results', async () => {
  const { service, calls, logs } = createService({
    rpc: async (_name, args, attempt) => ({
      data: [{
        credited: attempt <= 2,
        currency: args.p_currency_amount,
        experience: args.p_experience_amount,
      }],
      error: null,
    }),
  });

  const first = await service.creditFinishedMatch('match-id');
  const second = await service.creditFinishedMatch('match-id');
  assert.equal(calls.length, 4);
  assert.deepEqual(first.map(result => result.status), ['credited', 'credited']);
  assert.deepEqual(second.map(result => result.status), ['already_credited', 'already_credited']);
});

test('one RPC failure does not block the other player and a retry is safe', async () => {
  let failedOnce = false;
  const { service, calls, logs } = createService({
    rpc: async (_name, args) => {
      if (args.p_user_id === winnerId && !failedOnce) {
        failedOnce = true;
        return { data: null, error: { message: 'temporary RPC failure' } };
      }
      return {
        data: [{ credited: args.p_user_id !== loserId, currency: 5, experience: 10 }],
        error: null,
      };
    },
  });

  const first = await service.creditFinishedMatch('match-id');
  assert.deepEqual(first.map(result => result.status), ['failed', 'already_credited']);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /Reward RPC failed/);

  const retry = await service.creditFinishedMatch('match-id');
  assert.deepEqual(retry.map(result => result.status), ['credited', 'already_credited']);
  assert.equal(calls.length, 4);
});

test('game completion saves the result before requesting rewards', async () => {
  const operations = [];
  const supabase = {
    gamePersistenceConfigured: true,
    persistMatch: async snapshot => operations.push(`persist:${snapshot.state}`),
  };
  const rewards = {
    creditFinishedMatch: async () => {
      operations.push('credit');
      return [];
    },
  };
  const games = new GameService(
    undefined, undefined, undefined, undefined, undefined, supabase, rewards,
  );
  const game = games.createGame({
    whitePlayerId: '11111111-1111-4111-8111-111111111111',
    blackPlayerId: '22222222-2222-4222-8222-222222222222',
    mode: 'PVP',
  });

  games.finishGame(game.id, game.whitePlayerId, 'CHECKMATE');
  await games.flushGame(game.id);

  assert.deepEqual(operations, ['persist:IN_PROGRESS', 'persist:FINISHED', 'credit']);
});
