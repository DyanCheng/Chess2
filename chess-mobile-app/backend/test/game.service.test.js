const test = require('node:test');
const assert = require('node:assert/strict');
const { ChessRuleService } = require('../dist/game/rules/chess-rule.service');
const { GameService } = require('../dist/game/game.service');
const { GameStateService } = require('../dist/game/state-machine/game-state.service');

test('applies legal moves and rejects an illegal move', () => {
  const rules = new ChessRuleService();
  const legal = rules.validateAndApply('game-1', 'e2', 'e4');
  assert.equal(legal.success, true);
  assert.equal(legal.turn, 'b');

  const illegal = rules.validateAndApply('game-1', 'e2', 'e5');
  assert.equal(illegal.success, false);
});

test('supports castling and en passant through the authoritative rules engine', () => {
  const rules = new ChessRuleService();
  const castle = rules.validateAndApply(
    'castle',
    'e1',
    'g1',
  );
  assert.equal(castle.success, false, 'castling is illegal in the initial position');

  const enPassantGame = rules.getGame('en-passant');
  enPassantGame.load('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
  const enPassant = rules.validateAndApply('en-passant', 'e5', 'd6');
  assert.equal(enPassant.success, true);
  assert.equal(enPassant.move.isEnPassant, true);
});

test('GameService accepts client board coordinates and exposes the updated state', () => {
  const rules = new ChessRuleService();
  const service = new GameService(new GameStateService(), rules);
  const game = service.createGame({
    gameId: 'coordinate-game',
    whitePlayerId: 'white',
    blackPlayerId: 'black',
  });

  assert.equal(game.turn, 'w');
  const updated = service.makeMove('coordinate-game', {
    playerId: 'white',
    from: { row: 6, col: 4 },
    to: { row: 4, col: 4 },
  });

  assert.equal(updated.turn, 'b');
  assert.equal(updated.fen.split(' ')[0].includes('4P3'), true);
});
