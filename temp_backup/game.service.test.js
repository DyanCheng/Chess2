const test = require('node:test');
const assert = require('node:assert');
const { GameService } = require('../dist/game/game.service');

test('GameService should create a new game with initial FEN', () => {
  const service = new GameService();
  const result = service.createGame('player1', 'player2');
  
  assert.ok(result.success);
  assert.strictEqual(result.data.fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  assert.deepStrictEqual(result.data.history, []);
});

test('GameService should retrieve game details by ID', () => {
  const service = new GameService();
  const created = service.createGame();
  const gameId = created.data.gameId;

  const fetched = service.getGame(gameId);
  assert.strictEqual(fetched.data.gameId, gameId);
  assert.ok(fetched.data.fen);
});
