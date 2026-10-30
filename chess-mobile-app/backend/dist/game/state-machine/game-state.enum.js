"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSocketEvent = exports.GameEndReason = exports.GameState = void 0;
var GameState;
(function (GameState) {
    GameState["WAITING"] = "WAITING";
    GameState["STARTING"] = "STARTING";
    GameState["IN_PROGRESS"] = "IN_PROGRESS";
    GameState["CHECK"] = "CHECK";
    GameState["PAUSED"] = "PAUSED";
    GameState["FINISHED"] = "FINISHED";
    GameState["ABORTED"] = "ABORTED";
})(GameState || (exports.GameState = GameState = {}));
var GameEndReason;
(function (GameEndReason) {
    GameEndReason["CHECKMATE"] = "CHECKMATE";
    GameEndReason["STALEMATE"] = "STALEMATE";
    GameEndReason["HP_DEPLETED"] = "HP_DEPLETED";
    GameEndReason["TIMEOUT"] = "TIMEOUT";
    GameEndReason["RESIGNATION"] = "RESIGNATION";
    GameEndReason["DISCONNECT"] = "DISCONNECT";
    GameEndReason["DRAW_AGREEMENT"] = "DRAW_AGREEMENT";
    GameEndReason["ABORTED"] = "ABORTED";
})(GameEndReason || (exports.GameEndReason = GameEndReason = {}));
var GameSocketEvent;
(function (GameSocketEvent) {
    GameSocketEvent["FIND_MATCH"] = "find_match";
    GameSocketEvent["MATCH_FOUND"] = "match_found";
    GameSocketEvent["JOIN_GAME"] = "game:join";
    GameSocketEvent["LEAVE_GAME"] = "game:leave";
    GameSocketEvent["MAKE_MOVE"] = "make_move";
    GameSocketEvent["GAME_MOVE"] = "game:move";
    GameSocketEvent["USE_CARD"] = "game:use_card";
    GameSocketEvent["RESIGN"] = "game:resign";
    GameSocketEvent["SYNC_STATE"] = "game:sync_state";
    GameSocketEvent["MOVE_MADE"] = "move_made";
    GameSocketEvent["MOVE_REJECTED"] = "move_rejected";
    GameSocketEvent["STATE_UPDATED"] = "game:state_updated";
    GameSocketEvent["CARD_USED"] = "game:card_used";
    GameSocketEvent["TURN_CHANGED"] = "game:turn_changed";
    GameSocketEvent["CHECK_ALERT"] = "game:check_alert";
    GameSocketEvent["GAME_OVER"] = "game:over";
    GameSocketEvent["ERROR"] = "game:error";
})(GameSocketEvent || (exports.GameSocketEvent = GameSocketEvent = {}));
//# sourceMappingURL=game-state.enum.js.map