// ============================================================
// WebSocket Service - Real-time game communication
// ============================================================

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, EventCallback[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private serverUrl: string;

  constructor() {
    // TODO: Replace with actual backend WebSocket URL
    this.serverUrl = 'ws://localhost:3001';
  }

  /**
   * Connect to WebSocket server
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(`${this.serverUrl}?token=${token}`);

        this.socket.onopen = () => {
          console.log('[WS] Connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;
            const callbacks = this.listeners.get(type) || [];
            callbacks.forEach(cb => cb(payload));
          } catch (error) {
            console.error('[WS] Parse error:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('[WS] Disconnected');
          this.attemptReconnect(token);
        };

        this.socket.onerror = (error) => {
          console.error('[WS] Error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Send event to server
   */
  emit(type: string, payload: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[WS] Cannot send - not connected');
    }
  }

  /**
   * Listen for events
   */
  on(type: string, callback: EventCallback): () => void {
    const existing = this.listeners.get(type) || [];
    this.listeners.set(type, [...existing, callback]);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type) || [];
      this.listeners.set(type, callbacks.filter(cb => cb !== callback));
    };
  }

  /**
   * Remove all listeners for an event type
   */
  off(type: string): void {
    this.listeners.delete(type);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(token), delay);
  }

  /**
   * Check connection status
   */
  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();

// WebSocket event types for the chess game
export const WS_EVENTS = {
  // Matchmaking
  FIND_MATCH: 'find_match',
  MATCH_FOUND: 'match_found',
  CANCEL_MATCH: 'cancel_match',

  // Game actions
  MAKE_MOVE: 'make_move',
  MOVE_MADE: 'move_made',
  USE_CARD: 'use_card',
  CARD_USED: 'card_used',
  RESIGN: 'resign',
  OFFER_DRAW: 'offer_draw',
  ACCEPT_DRAW: 'accept_draw',

  // Game state
  GAME_STATE: 'game_state',
  GAME_OVER: 'game_over',
  HP_UPDATE: 'hp_update',
  TIMER_UPDATE: 'timer_update',

  // Player
  PLAYER_CONNECTED: 'player_connected',
  PLAYER_DISCONNECTED: 'player_disconnected',

  // Chat
  CHAT_MESSAGE: 'chat_message',
} as const;
