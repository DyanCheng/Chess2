/*
 * Live integration smoke test. It creates two disposable users through the
 * public backend API, confirms them with the backend-only Supabase secret when
 * the project requires email confirmation, plays a short Socket.IO match, and
 * deletes all test data in a finally block.
 *
 * Run from the repository root with the backend available at localhost:8080:
 *   node backend/test/live-supabase-flow.cjs
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const root = path.resolve(__dirname, '..', '..');
const { createClient } = require(path.join(root, 'backend', 'node_modules', '@supabase', 'supabase-js'));
const { io } = require(path.join(root, 'mobile', 'node_modules', 'socket.io-client'));

function loadEnv(file) {
  const values = {};
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return values;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(serverUrl, endpoint, options = {}) {
  const response = await fetch(`${serverUrl}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const detail = typeof body === 'object' && body?.message ? body.message : String(body || '');
    throw new Error(`${options.method || 'GET'} ${endpoint}: HTTP ${response.status} ${detail}`.trim());
  }
  return body;
}

function waitForEvent(socket, event, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timeout waiting for ${event}`));
    }, timeoutMs);
    function onEvent(payload) {
      clearTimeout(timeout);
      resolve(payload);
    }
    socket.once(event, onEvent);
  });
}

function connectSocket(serverUrl, token) {
  const socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout connecting authenticated Socket.IO client'));
    }, 15000);
    socket.once('connect', () => {
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.once('connect_error', error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function emitAck(socket, event, payload) {
  const result = await socket.timeout(15000).emitWithAck(event, payload);
  if (result?.status === 'error') throw new Error(`${event}: ${result.message || 'socket error'}`);
  return result;
}

async function main() {
  const env = loadEnv(path.join(root, '.env'));
  const serverUrl = process.env.TEST_BACKEND_URL || 'http://127.0.0.1:8080';
  for (const name of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY']) {
    assert(env[name], `${name} is missing from .env`);
  }

  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const suffix = randomUUID().replaceAll('-', '').slice(0, 16);
  const password = `Chess2!${suffix}Aa9`;
  const accounts = [
    { email: `chess2.e2e.${suffix}.a@gmail.com`, username: `e2e_a_${suffix}` },
    { email: `chess2.e2e.${suffix}.b@gmail.com`, username: `e2e_b_${suffix}` },
  ];
  const userIds = [];
  let publicRegistrationCount = 0;
  let registrationRateLimited = false;
  const sockets = [];
  let matchId = null;
  let testError = null;
  const cleanupErrors = [];

  try {
    for (const account of accounts) {
      let registration;
      try {
        registration = await request(serverUrl, '/auth/register', {
          method: 'POST', body: JSON.stringify({ ...account, password }),
        });
        publicRegistrationCount += 1;
      } catch (error) {
        if (!/email rate limit exceeded/i.test(error.message)) throw error;
        registrationRateLimited = true;
        const { data, error: createError } = await admin.auth.admin.createUser({
          email: account.email,
          password,
          email_confirm: true,
          user_metadata: { username: account.username },
        });
        if (createError) throw createError;
        registration = {
          user: data.user,
          emailConfirmationRequired: false,
        };
      }
      assert(registration?.user?.id, 'Registration did not return a user id');
      userIds.push(registration.user.id);
      if (registration.emailConfirmationRequired) {
        const { error } = await admin.auth.admin.updateUserById(registration.user.id, { email_confirm: true });
        if (error) throw error;
      }
    }

    const sessions = [];
    for (const account of accounts) {
      const session = await request(serverUrl, '/auth/login', {
        method: 'POST', body: JSON.stringify({ email: account.email, password }),
      });
      assert(session?.accessToken && session?.refreshToken, 'Login did not return a complete session');
      const profile = await request(serverUrl, '/player/profile', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      assert(profile?.id === session.user.id, 'Authenticated profile does not match the session user');
      sessions.push(session);
    }

    sockets.push(await connectSocket(serverUrl, sessions[0].accessToken));
    sockets.push(await connectSocket(serverUrl, sessions[1].accessToken));
    const foundA = waitForEvent(sockets[0], 'matchmaking:found');
    const foundB = waitForEvent(sockets[1], 'matchmaking:found');
    sockets[0].emit('matchmaking:join', { rating: 1000 });
    sockets[1].emit('matchmaking:join', { rating: 1000 });
    const [matchA, matchB] = await Promise.all([foundA, foundB]);
    assert(matchA.gameId === matchB.gameId, 'Players received different match ids');
    matchId = matchA.gameId;

    await Promise.all(sockets.map(socket => emitAck(socket, 'game:join', { gameId: matchId })));
    const whiteSocket = matchA.color === 'w' ? sockets[0] : sockets[1];
    const blackSocket = matchA.color === 'b' ? sockets[0] : sockets[1];
    await emitAck(whiteSocket, 'game:move', { gameId: matchId, move: { from: 'e2', to: 'e4' } });
    await emitAck(blackSocket, 'game:move', { gameId: matchId, move: { from: 'e7', to: 'e5' } });
    await emitAck(whiteSocket, 'game:resign', { gameId: matchId });

    for (const session of sessions) {
      const history = await request(serverUrl, '/matches/history?page=1&limit=20', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      assert(history.matches.some(match => match.id === matchId), 'Finished match is absent from player history');
    }

    const { data: savedMatch, error: matchError } = await admin.from('matches')
      .select('id,status,winner_id,fen,white_time_ms,black_time_ms,end_reason')
      .eq('id', matchId).single();
    if (matchError) throw matchError;
    const { count: playerCount, error: playersError } = await admin.from('match_players')
      .select('id', { count: 'exact', head: true }).eq('match_id', matchId);
    if (playersError) throw playersError;
    const { count: moveCount, error: movesError } = await admin.from('match_moves')
      .select('id', { count: 'exact', head: true }).eq('match_id', matchId);
    if (movesError) throw movesError;

    assert(savedMatch.status === 'FINISHED', `Unexpected saved status: ${savedMatch.status}`);
    assert(savedMatch.end_reason === 'RESIGN', `Unexpected end reason: ${savedMatch.end_reason}`);
    assert(playerCount === 2, `Expected 2 persisted players, received ${playerCount}`);
    assert(moveCount === 2, `Expected 2 persisted moves, received ${moveCount}`);
    assert(Boolean(savedMatch.fen), 'Persisted match is missing FEN');

    const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${sessions[0].accessToken}` } },
    });
    const { data: visibleMatch, error: visibleError } = await userClient.from('matches')
      .select('id').eq('id', matchId).single();
    if (visibleError) throw visibleError;
    assert(visibleMatch.id === matchId, 'RLS did not expose the participant match');
    const { error: forbiddenWrite } = await userClient.from('matches').insert({ id: randomUUID(), match_type: 'PVP' });
    assert(forbiddenWrite, 'RLS/privileges unexpectedly allowed a client match insert');

    console.log(JSON.stringify({
      ok: true,
      publicRegistration: publicRegistrationCount,
      registrationRateLimited,
      adminProvisionedForRemainingUsers: 2 - publicRegistrationCount,
      login: 2,
      authenticatedProfiles: 2,
      socketPlayers: 2,
      persistedMatch: true,
      persistedPlayers: playerCount,
      persistedMoves: moveCount,
      participantRlsRead: true,
      clientWriteBlocked: true,
      matchId,
    }, null, 2));
  } catch (error) {
    testError = error;
  } finally {
    for (const socket of sockets) socket.disconnect();
    if (matchId) {
      for (const table of ['match_moves', 'match_players', 'matches']) {
        const column = table === 'matches' ? 'id' : 'match_id';
        const { error } = await admin.from(table).delete().eq(column, matchId);
        if (error) cleanupErrors.push(`${table}: ${error.message}`);
      }
    }
    for (const userId of userIds) {
      for (const table of ['user_roles', 'user_settings', 'wallets', 'profiles']) {
        const column = table === 'profiles' ? 'id' : 'user_id';
        const { error } = await admin.from(table).delete().eq(column, userId);
        if (error) cleanupErrors.push(`${table}: ${error.message}`);
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) cleanupErrors.push(`auth.users: ${error.message}`);
    }
  }

  if (testError) throw testError;
  if (cleanupErrors.length) throw new Error(`Live test passed but cleanup failed: ${cleanupErrors.join('; ')}`);
}

main().catch(error => {
  console.error(`LIVE_E2E_FAILED: ${error.message}`);
  process.exitCode = 1;
});
