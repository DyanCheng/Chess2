// ============================================================
// useWebSocket Hook - WebSocket connection management
// ============================================================

import { useEffect, useCallback, useRef, useState } from 'react';
import { wsService, WS_EVENTS } from '../services/websocket/wsService';
import { useAuthStore } from '../store/authStore';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuthStore();
  const listenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (token) {
      wsService.connect(token)
        .then(() => setIsConnected(true))
        .catch(() => setIsConnected(false));
    }

    return () => {
      // Cleanup listeners
      listenersRef.current.forEach(unsub => unsub());
      listenersRef.current = [];
    };
  }, [token]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    const unsub = wsService.on(event, callback);
    listenersRef.current.push(unsub);
    return unsub;
  }, []);

  const emit = useCallback((event: string, data: any) => {
    wsService.emit(event, data);
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    subscribe,
    emit,
    disconnect,
    WS_EVENTS,
  };
}
