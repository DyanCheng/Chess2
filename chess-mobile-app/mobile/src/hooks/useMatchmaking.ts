import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getServerSocket } from '../services/websocket/serverSocket';
import { useAuthStore } from '../store/authStore';
import { MatchmakingStatus } from '../types/game';

export interface FoundMatch {
  gameId: string;
  color: 'w' | 'b';
  opponentId: string;
  playerId: string;
}

export function useMatchmaking() {
  const [matchStatus, setMatchStatus] = useState<MatchmakingStatus>({
    status: 'cancelled', estimatedWait: 0, playersOnline: 0,
  });
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<FoundMatch | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const playerRef = useRef<string | null>(null);
  const activeRef = useRef(false);
  const matchedRef = useRef(false);

  const cancelSearch = useCallback(() => {
    activeRef.current = false;
    if (!matchedRef.current && socketRef.current && playerRef.current) {
      socketRef.current.emit('matchmaking:leave');
    }
    socketRef.current?.off('matchmaking:found');
    if (!matchedRef.current) {
      setMatchStatus({ status: 'cancelled', estimatedWait: 0, playersOnline: 0 });
    }
  }, []);

  const startSearching = useCallback(async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    matchedRef.current = false;
    setError(null);
    setSearchTime(0);
    setMatch(null);
    setMatchStatus({ status: 'searching', estimatedWait: 0, playersOnline: 0 });
    try {
      const playerId = useAuthStore.getState().userId;
      if (!playerId) throw new Error('Đăng nhập trước khi chơi PvP.');
      const socket = await getServerSocket();
      if (!activeRef.current) return;
      socketRef.current = socket;
      playerRef.current = playerId;
      socket.on('matchmaking:found', (found: Omit<FoundMatch, 'playerId'>) => {
        if (!activeRef.current) return;
        matchedRef.current = true;
        setMatch({ ...found, playerId });
        setMatchStatus({ status: 'found', estimatedWait: 0, playersOnline: 0, gameId: found.gameId });
      });
      socket.emit('matchmaking:join', { rating: 1000 });
    } catch (reason) {
      if (!activeRef.current) return;
      activeRef.current = false;
      setError(reason instanceof Error ? reason.message : 'Không thể tìm trận');
      setMatchStatus({ status: 'cancelled', estimatedWait: 0, playersOnline: 0 });
    }
  }, []);

  useEffect(() => {
    if (matchStatus.status !== 'searching') return;
    const interval = setInterval(() => setSearchTime(value => value + 1), 1000);
    return () => clearInterval(interval);
  }, [matchStatus.status]);

  useEffect(() => cancelSearch, [cancelSearch]);

  return { matchStatus, searchTime, startSearching, cancelSearch, match, error };
}
