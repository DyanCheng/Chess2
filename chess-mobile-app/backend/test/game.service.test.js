const test = require('node:test');
const assert = require('node:assert');
const { GameService } = require('../dist/game/game.service');

test('GameService should be defined', () => {
  const service = new GameService();
  assert.ok(service);
});
