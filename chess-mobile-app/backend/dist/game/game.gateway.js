"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const game_service_1 = require("./game.service");
const game_state_enum_1 = require("./state-machine/game-state.enum");
let GameGateway = class GameGateway {
    constructor(gameService) {
        this.gameService = gameService;
    }
    handleConnection(_client) { }
    handleDisconnect(_client) { }
    handleFindMatch(client, payload) {
        return this.gameService.addToMatchmaking(payload.playerId, client, this.server);
    }
    handleMakeMoveEvent(_client, payload) {
        return this.gameService.handleMove(payload.playerId, payload.gameId, payload.from, payload.to, this.server, payload.promotion);
    }
    handleStandardMove(_client, payload) {
        return this.gameService.handleMove(payload.playerId, payload.gameId, payload.from, payload.to, this.server, payload.promotion);
    }
    handleJoinGame(client, payload) {
        client.join(payload.gameId);
        const game = this.gameService.joinGame(payload.gameId, payload.playerId);
        this.server?.to(payload.gameId).emit(game_state_enum_1.GameSocketEvent.STATE_UPDATED, game);
        return { success: true, data: game };
    }
    handleResign(_client, payload) {
        const game = this.gameService.resignGame(payload.gameId, payload.playerId);
        this.server?.to(game.id).emit(game_state_enum_1.GameSocketEvent.GAME_OVER, {
            gameId: game.id,
            winnerId: game.winnerId,
            reason: game.endReason,
            state: game.state,
        });
        return { success: true, data: game };
    }
    handleSyncState(client, payload) {
        const game = this.gameService.getGameOrThrow(payload.gameId);
        client.emit(game_state_enum_1.GameSocketEvent.STATE_UPDATED, game);
        return { success: true, data: game };
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(game_state_enum_1.GameSocketEvent.FIND_MATCH),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleFindMatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(game_state_enum_1.GameSocketEvent.MAKE_MOVE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleMakeMoveEvent", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(game_state_enum_1.GameSocketEvent.GAME_MOVE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleStandardMove", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(game_state_enum_1.GameSocketEvent.JOIN_GAME),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleJoinGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(game_state_enum_1.GameSocketEvent.RESIGN),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleResign", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(game_state_enum_1.GameSocketEvent.SYNC_STATE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleSyncState", null);
exports.GameGateway = GameGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map