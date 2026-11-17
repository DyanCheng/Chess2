const test = require('node:test');
const assert = require('node:assert/strict');
const { ForbiddenException, NotFoundException } = require('@nestjs/common');
const { UsersService } = require('../dist/users/users.service');
const { HistoryService } = require('../dist/history/history.service');
const { RoomService } = require('../dist/rooms/room.service');

test('player stats only aggregate the authenticated player match list', async () => {
  const service = new UsersService({
    getPlayerRating: async () => 1340,
    getPlayerMatchStats: async () => [
      { status: 'FINISHED', winner_id: 'user-1', started_at: '2026-11-17T00:00:00Z', ended_at: '2026-11-17T00:01:00Z' },
      { status: 'FINISHED', winner_id: 'user-1', started_at: '2026-11-16T00:00:00Z', ended_at: '2026-11-16T00:02:00Z' },
      { status: 'DRAW', winner_id: null, started_at: null, ended_at: null },
      { status: 'FINISHED', winner_id: 'other-user', started_at: null, ended_at: null },
    ],
  });
  const stats = await service.getStats('user-1');
  assert.deepEqual(
    { games: stats.totalGames, wins: stats.wins, losses: stats.losses, draws: stats.draws },
    { games: 4, wins: 2, losses: 1, draws: 1 },
  );
  assert.equal(stats.rating, 1340);
  assert.equal(stats.currentWinStreak, 2);
  assert.equal(stats.longestWinStreak, 2);
  assert.equal(stats.avgGameDuration, 90);
});

test('history detail rejects a match that is not owned by the player', async () => {
  const service = new HistoryService({ getMatchForPlayer: async () => null });
  await assert.rejects(
    () => service.getMatchDetail('user-1', 'match-1'),
    error => error instanceof NotFoundException,
  );
});

test('history replay reconstructs stored legal moves without inventing HP events', async () => {
  const service = new HistoryService({
    getMatchForPlayer: async () => ({
      id: 'match-1', fen: null, winner_id: null, end_reason: null,
      started_at: '2026-11-17T00:00:00Z', created_at: '2026-11-17T00:00:00Z', ended_at: null,
      match_players: [
        { user_id: 'user-1', color: 'WHITE', current_hp: 100 },
        { user_id: 'user-2', color: 'BLACK', current_hp: 100 },
      ],
      match_moves: [{
        move_number: 1, player_id: 'user-1', from_square: 'e2', to_square: 'e4',
        piece: 'p', captured_piece: null, special_effect: {}, timestamp: '2026-11-17T00:00:10Z',
      }],
    }),
  });
  const replay = await service.getReplay('user-1', 'match-1');
  assert.equal(replay.totalSteps, 1);
  assert.equal(replay.moves[0].valid, true);
  assert.match(replay.moves[0].fenAfter, / b /);
  assert.equal('whiteHp' in replay.moves[0], false);
});

test('custom rooms enforce membership and host-only start', () => {
  let created;
  const rooms = new RoomService({
    createGame: input => {
      created = { id: 'game-1', ...input };
      return created;
    },
    serializeGame: game => ({ id: game.id }),
  });
  const room = rooms.create({ hostId: 'host', hostUsername: 'Host', isPrivate: true, password: 'secret' });
  assert.equal('password' in rooms.publicView(room), false);
  assert.throws(() => rooms.message(room.id, 'outsider', 'Nope', 'hello'), ForbiddenException);
  assert.throws(() => rooms.join({ roomIdOrCode: room.code, userId: 'guest', username: 'Guest', password: 'wrong' }), ForbiddenException);

  rooms.join({ roomIdOrCode: room.code, userId: 'guest', username: 'Guest', password: 'secret' });
  rooms.ready(room.id, 'guest', true);
  assert.throws(() => rooms.start(room.id, 'guest'), ForbiddenException);
  const started = rooms.start(room.id, 'host');
  assert.equal(started.game.gameId, 'game-1');
  assert.equal(created.whitePlayerId, 'host');
  assert.equal(created.blackPlayerId, 'guest');
});
