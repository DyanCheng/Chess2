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
    constructor() {
        this.validTransitions = {
            [game_state_enum_1.GameState.WAITING]: [game_state_enum_1.GameState.STARTING, game_state_enum_1.GameState.IN_PROGRESS, game_state_enum_1.GameState.ABORTED],
            [game_state_enum_1.GameState.STARTING]: [game_state_enum_1.GameState.IN_PROGRESS, game_state_enum_1.GameState.ABORTED],
            [game_state_enum_1.GameState.IN_PROGRESS]: [
                game_state_enum_1.GameState.CHECK,
                game_state_enum_1.GameState.PAUSED,
                game_state_enum_1.GameState.FINISHED,
                game_state_enum_1.GameState.ABORTED,
            ],
            [game_state_enum_1.GameState.CHECK]: [
                game_state_enum_1.GameState.IN_PROGRESS,
                game_state_enum_1.GameState.PAUSED,
                game_state_enum_1.GameState.FINISHED,
            ],
            [game_state_enum_1.GameState.PAUSED]: [
                game_state_enum_1.GameState.IN_PROGRESS,
                game_state_enum_1.GameState.CHECK,
                game_state_enum_1.GameState.FINISHED,
                game_state_enum_1.GameState.ABORTED,
            ],
            [game_state_enum_1.GameState.FINISHED]: [],
            [game_state_enum_1.GameState.ABORTED]: [],
        };
    }
    canTransition(from, to) {
        if (from === to)
            return true;
        return this.validTransitions[from]?.includes(to) ?? false;
    }
    transition(from, to) {
        if (!this.canTransition(from, to)) {
            throw new common_1.BadRequestException(`Không thể chuyển trạng thái ván đấu từ ${from} sang ${to}`);
        }
        return to;
    }
    isPlayable(state) {
        return state === game_state_enum_1.GameState.IN_PROGRESS || state === game_state_enum_1.GameState.CHECK;
    }
    isTerminal(state) {
        return state === game_state_enum_1.GameState.FINISHED || state === game_state_enum_1.GameState.ABORTED;
    }
};
exports.GameStateService = GameStateService;
exports.GameStateService = GameStateService = __decorate([
    (0, common_1.Injectable)()
], GameStateService);
//# sourceMappingURL=game-state.service.js.map