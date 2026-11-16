import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getServerSocket } from '../services/websocket/serverSocket';
import { useAuthStore } from '../store/authStore';
import { MatchmakingStatus } from '../types/game';

export interface MatchmakingOptions {
  queueType: 'RANKED' | 'CASUAL';
  timeControlId: string;
  gameModeCode?: string;
}

export interface FoundMatch {
  gameId: string;
  color: 'w' | 'b';
  opponentId: string;
  playerId: string;
}

export function useMatchmaking(options: MatchmakingOptions) {
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
  const foundHandlerRef = useRef<((found: Omit<FoundMatch, 'playerId'>) => void) | null>(null);
  const errorHandlerRef = useRef<((reason: { message?: string }) => void) | null>(null);

  const cancelSearch = useCallback(() => {
    activeRef.current = false;
    if (!matchedRef.current && socketRef.current && playerRef.current) {
      socketRef.current.emit('matchmaking:leave');
    }
    if (foundHandlerRef.current) {
      socketRef.current?.off('matchmaking:found', foundHandlerRef.current);
      foundHandlerRef.current = null;
    }
    if (errorHandlerRef.current) {
      socketRef.current?.off('exception', errorHandlerRef.current);
      errorHandlerRef.current = null;
    }
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
      const handleFound = (found: Omit<FoundMatch, 'playerId'>) => {
        if (!activeRef.current) return;
        matchedRef.current = true;
        setMatch({ ...found, playerId });
        setMatchStatus({ status: 'found', estimatedWait: 0, playersOnline: 0, gameId: found.gameId });
        if (errorHandlerRef.current) socket.off('exception', errorHandlerRef.current);
        errorHandlerRef.current = null;
      };
      const handleError = (reason: { message?: string }) => {
        if (!activeRef.current) return;
        activeRef.current = false;
        setError(reason?.message || 'Không thể tìm trận');
        setMatchStatus({ status: 'cancelled', estimatedWait: 0, playersOnline: 0 });
        if (foundHandlerRef.current) socket.off('matchmaking:found', foundHandlerRef.current);
        socket.off('exception', handleError);
        foundHandlerRef.current = null;
        errorHandlerRef.current = null;
      };
      if (foundHandlerRef.current) socket.off('matchmaking:found', foundHandlerRef.current);
      if (errorHandlerRef.current) socket.off('exception', errorHandlerRef.current);
      foundHandlerRef.current = handleFound;
      errorHandlerRef.current = handleError;
      socket.on('matchmaking:found', handleFound);
      socket.on('exception', handleError);
      socket.emit('matchmaking:join', {
        ...options,
        gameModeCode: options.gameModeCode ?? 'STANDARD',
      });
    } catch (reason) {
      if (!activeRef.current) return;
      activeRef.current = false;
      setError(reason instanceof Error ? reason.message : 'Không thể tìm trận');
      setMatchStatus({ status: 'cancelled', estimatedWait: 0, playersOnline: 0 });
    }
  }, [options.gameModeCode, options.queueType, options.timeControlId]);

  useEffect(() => {
    if (matchStatus.status !== 'searching') return;
    const interval = setInterval(() => setSearchTime(value => value + 1), 1000);
    return () => clearInterval(interval);
  }, [matchStatus.status]);

  useEffect(() => cancelSearch, [cancelSearch]);

  return { matchStatus, searchTime, startSearching, cancelSearch, match, error };
}
