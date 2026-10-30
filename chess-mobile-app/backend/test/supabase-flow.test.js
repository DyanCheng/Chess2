const test = require('node:test');
const assert = require('node:assert/strict');
const { AuthService } = require('../dist/auth/auth.service');
const { accessTokenFromHeader } = require('../dist/auth/token');
const { GameService } = require('../dist/game/game.service');
const { GameStateService } = require('../dist/game/state-machine/game-state.service');
const { ChessRuleService } = require('../dist/game/rules/chess-rule.service');

test('auth registration uses Supabase Auth and never returns a fake session', async () => {
  const auth = new AuthService({
    publicClient: () => ({ auth: {
      signUp: async () => ({ data: { user: { id: 'user-1', email: 'a@example.com' }, session: null }, error: null }),
    } }),
  });
  const result = await auth.register(' A@Example.com ', 'password123', 'Alice');
  assert.equal(result.emailConfirmationRequired, true);
  assert.equal(result.accessToken, null);
  assert.equal(result.user.id, 'user-1');
});

test('auth registration preserves the Supabase email rate-limit status', async () => {
  const auth = new AuthService({
    publicClient: () => ({ auth: {
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: 'email rate limit exceeded', status: 429, code: 'over_email_send_rate_limit' },
      }),
    } }),
  });
  await assert.rejects(
    () => auth.register('a@example.com', 'password123', 'Alice'),
    error => error.getStatus() === 429,
  );
});

test('profile endpoints require a bearer token', () => {
  assert.throws(() => accessTokenFromHeader(undefined));
  assert.equal(accessTokenFromHeader('Bearer token-123'), 'token-123');
});

test('match state is written through the Supabase adapter before flush resolves', async () => {
  const stored = [];
  const database = {
    gamePersistenceConfigured: true,
    persistMatch: async snapshot => { stored.push(snapshot); },
  };
  const service = new GameService(
    new GameStateService(),
    new ChessRuleService(),
    undefined,
    undefined,
    undefined,
    database,
  );
  const game = service.createGame({
    gameId: '11111111-1111-4111-8111-111111111111',
    whitePlayerId: '22222222-2222-4222-8222-222222222222',
    blackPlayerId: '33333333-3333-4333-8333-333333333333',
  });
  await service.flushGame(game.id);
  assert.equal(stored[0].id, game.id);
  assert.equal(stored[0].fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
  service.makeMove({
    gameId: game.id,
    playerId: game.whitePlayerId,
    from: 'e2',
    to: 'e4',
  });
  await service.flushGame(game.id);
  assert.equal(stored.at(-1).moveHistory.length, 1);
});
