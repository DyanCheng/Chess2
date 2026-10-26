// chess-mobile-app/backend/src/matchmaking/matchmaking.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchmakingService } from './matchmaking.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MatchmakingGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly matchmakingService: MatchmakingService) {}

  @SubscribeMessage('matchmaking:join')
  handleJoinQueue(
    @MessageBody() payload: { playerId: string; rating?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.matchmakingService.joinQueue(
      payload.playerId,
      payload.rating ?? 1000,
      client.id,
    );

    if (result.status === 'MATCHED' && result.match) {
      const { gameId, whitePlayer, blackPlayer, gameState } = result.match;

      if (whitePlayer.socketId && this.server) {
        this.server.to(whitePlayer.socketId).emit('matchmaking:found', {
          gameId,
          color: 'w',
          opponentId: blackPlayer.playerId,
          gameState,
        });
      }

      if (blackPlayer.socketId && this.server) {
        this.server.to(blackPlayer.socketId).emit('matchmaking:found', {
          gameId,
          color: 'b',
          opponentId: whitePlayer.playerId,
          gameState,
        });
      }
    }

    return result;
  }

  @SubscribeMessage('matchmaking:leave')
  handleLeaveQueue(@MessageBody() payload: { playerId: string }) {
    return this.matchmakingService.leaveQueue(payload.playerId);
  }

  handleDisconnect(client: Socket) {
    this.matchmakingService.handleSocketDisconnect(client.id);
  }
}