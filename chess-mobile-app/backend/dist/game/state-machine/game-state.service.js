"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateService = void 0;
const common_1 = require("@nestjs/common");
const game_state_enum_1 = require("./game-state.enum");
let GameStateService = class GameStateService {
    canTransition(currentState, nextState) {
        switch (currentState) {
            case game_state_enum_1.GameState.WAITING:
                return [game_state_enum_1.GameState.IN_PROGRESS, game_state_enum_1.GameState.CANCELLED].includes(nextState);
            case game_state_enum_1.GameState.IN_PROGRESS:
                return [game_state_enum_1.GameState.FINISHED, game_state_enum_1.GameState.CANCELLED].includes(nextState);
            default:
                return false;
        }
    }
    updateBoardState(currentFen, move) {
        return 'new-fen-string-after-move';
    }
};
exports.GameStateService = GameStateService;
exports.GameStateService = GameStateService = __decorate([
    (0, common_1.Injectable)()
], GameStateService);
//# sourceMappingURL=game-state.service.js.map