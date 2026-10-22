import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('game:join')
  handleJoinGame(
    @MessageBody() payload: { gameId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(payload.gameId);
    // Sử dụng tính năng Reconnect của Sprint 4
    const gameState = this.gameService.handleReconnect(
      payload.gameId,
      payload.playerId,
      client.id,
    );
    this.server.to(payload.gameId).emit('game:updated', gameState);
    return gameState;
  }

  @SubscribeMessage('game:move')
  handleMove(
    @MessageBody() payload: { gameId: string; move: any },
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = this.gameService.makeMove(payload.gameId, payload.move);
    this.server.to(payload.gameId).emit('game:updated', gameState);
    return gameState;
  }

  @SubscribeMessage('game:resign')
  handleResign(
    @MessageBody() payload: { gameId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = this.gameService.resign(payload.gameId, payload.playerId);
    this.server.to(payload.gameId).emit('game:updated', gameState);
    return gameState;
  }

  @SubscribeMessage('game:sync')
  handleSync(
    @MessageBody() payload: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    return this.gameService.getGameState(payload.gameId);
  }

  handleDisconnect(client: Socket) {
    // Ngắt kết nối socket được xử lý qua timeout bên trong GameService
  }
}