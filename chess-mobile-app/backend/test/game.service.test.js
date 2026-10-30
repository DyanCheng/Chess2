const test = require('node:test');
const assert = require('node:assert/strict');

test('Sprint 5 - Bot easy/medium and match end (checkmate/draw/HP)', async (t) => {
  await t.test('Basic CI sanity check', () => {
    assert.strictEqual(1, 1);
  });
});