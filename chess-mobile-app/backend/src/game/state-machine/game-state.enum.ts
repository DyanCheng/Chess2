export enum GameState {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  CHECK = 'CHECK',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
  ABORTED = 'ABORTED',
}

export enum GameEndReason {
  CHECKMATE = 'CHECKMATE',
  STALEMATE = 'STALEMATE',
  HP_DEPLETED = 'HP_DEPLETED',
  TIMEOUT = 'TIMEOUT',
  RESIGNATION = 'RESIGNATION',
  DISCONNECT = 'DISCONNECT',
  DRAW_AGREEMENT = 'DRAW_AGREEMENT',
  ABORTED = 'ABORTED',
}

export enum GameSocketEvent {
  // Matchmaking & Room
  FIND_MATCH = 'find_match',
  MATCH_FOUND = 'match_found',
  JOIN_GAME = 'game:join',
  LEAVE_GAME = 'game:leave',

  // Client -> Server
  MAKE_MOVE = 'make_move',
  GAME_MOVE = 'game:move',
  USE_CARD = 'game:use_card',
  RESIGN = 'game:resign',
  SYNC_STATE = 'game:sync_state',

  // Server -> Client
  MOVE_MADE = 'move_made',
  MOVE_REJECTED = 'move_rejected',
  STATE_UPDATED = 'game:state_updated',
  CARD_USED = 'game:card_used',
  TURN_CHANGED = 'game:turn_changed',
  CHECK_ALERT = 'game:check_alert',
  GAME_OVER = 'game:over',
  ERROR = 'game:error',
}