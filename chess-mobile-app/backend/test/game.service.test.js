const assert = require('node:assert/strict');
const test = require('node:test');

const { GameService } = require('../dist/game/game.service');

function socket() {
  return { join() {} };
}

function server(events) {
  return {
    to(room) {
      return {
        emit(name, payload) {
          events.push({ room, name, payload });
        },
      };
    },
  };
}

test('matches two players and broadcasts only a legal move from the active player', () => {
  const gameService = new GameService();
  const events = [];
  const io = server(events);

  gameService.addToMatchmaking('white', socket(), io);
  gameService.addToMatchmaking('black', socket(), io);

  const match = events.find((event) => event.name === 'match_found');
  assert.ok(match, 'a match should be created for two queued players');

  gameService.handleMove(
    'white',
    match.payload.gameId,
    { row: 6, col: 4 },
    { row: 4, col: 4 },
    io,
  );

  const moves = events.filter((event) => event.name === 'move_made');
  assert.equal(moves.length, 1);
  assert.equal(moves[0].payload.fen.split(' ')[1], 'b');

  gameService.handleMove(
    'white',
    match.payload.gameId,
    { row: 6, col: 3 },
    { row: 4, col: 3 },
    io,
  );
  assert.equal(events.filter((event) => event.name === 'move_made').length, 1);
});
