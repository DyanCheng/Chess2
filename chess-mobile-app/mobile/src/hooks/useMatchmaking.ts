// ============================================================
// useMatchmaking Hook - PvP matchmaking
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { MatchmakingStatus } from '../types/game';

export function useMatchmaking() {
  const [status, setStatus] = useState<MatchmakingStatus>({
    status: 'cancelled',
    estimatedWait: 0,
    playersOnline: 0,
  });
  const [searchTime, setSearchTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSearching = useCallback(() => {
    setStatus({
      status: 'searching',
      estimatedWait: 15,
      playersOnline: Math.floor(Math.random() * 500) + 100,
    });
    setSearchTime(0);

    timerRef.current = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    // Simulate finding a match after random time
    const findDelay = 3000 + Math.random() * 7000;
    setTimeout(() => {
      setStatus({
        status: 'found',
        estimatedWait: 0,
        playersOnline: Math.floor(Math.random() * 500) + 100,
        gameId: `game_${Date.now()}`,
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }, findDelay);
  }, []);

  const cancelSearch = useCallback(() => {
    setStatus({ status: 'cancelled', estimatedWait: 0, playersOnline: 0 });
    setSearchTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    matchStatus: status,
    searchTime,
    startSearching,
    cancelSearch,
    isSearching: status.status === 'searching',
    matchFound: status.status === 'found',
  };
}
