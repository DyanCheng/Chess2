import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService, BoardPosition } from './game.service';
import { GameSocketEvent } from './state-machine/game-state.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  handleConnection(_client: Socket) {}

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage(GameSocketEvent.FIND_MATCH)
  handleFindMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { playerId: string },
  ) {
    return this.gameService.addToMatchmaking(
      payload.playerId,
      client,
      this.server,
    );
  }

  @SubscribeMessage(GameSocketEvent.MAKE_MOVE)
  handleMakeMoveEvent(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    payload: {
      playerId: string;
      gameId: string;
      from: BoardPosition;
      to: BoardPosition;
      promotion?: 'q' | 'r' | 'b' | 'n';
    },
  ) {
    return this.gameService.handleMove(
      payload.playerId,
      payload.gameId,
      payload.from,
      payload.to,
      this.server,
      payload.promotion,
    );
  }

  @SubscribeMessage(GameSocketEvent.GAME_MOVE)
  handleStandardMove(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    payload: {
      playerId: string;
      gameId: string;
      from: BoardPosition;
      to: BoardPosition;
      promotion?: 'q' | 'r' | 'b' | 'n';
    },
  ) {
    return this.gameService.handleMove(
      payload.playerId,
      payload.gameId,
      payload.from,
      payload.to,
      this.server,
      payload.promotion,
    );
  }

  @SubscribeMessage(GameSocketEvent.JOIN_GAME)
  handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string; playerId: string },
  ) {
    client.join(payload.gameId);
    const game = this.gameService.joinGame(payload.gameId, payload.playerId);
    this.server?.to(payload.gameId).emit(GameSocketEvent.STATE_UPDATED, game);
    return { success: true, data: game };
  }

  @SubscribeMessage(GameSocketEvent.RESIGN)
  handleResign(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: { gameId: string; playerId: string },
  ) {
    const game = this.gameService.resignGame(payload.gameId, payload.playerId);
    this.server?.to(game.id).emit(GameSocketEvent.GAME_OVER, {
      gameId: game.id,
      winnerId: game.winnerId,
      reason: game.endReason,
      state: game.state,
    });
    return { success: true, data: game };
  }

  @SubscribeMessage(GameSocketEvent.SYNC_STATE)
  handleSyncState(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string },
  ) {
    const game = this.gameService.getGameOrThrow(payload.gameId);
    client.emit(GameSocketEvent.STATE_UPDATED, game);
    return { success: true, data: game };
  }
}