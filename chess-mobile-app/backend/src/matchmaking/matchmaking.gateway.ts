// chess-mobile-app/backend/src/matchmaking/matchmaking.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchmakingService } from './matchmaking.service';
import { GameService } from '../game/game.service';
import { AuthService } from '../auth/auth.service';
import { PresenceService } from '../presence/presence.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MatchmakingGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly matchmakingService: MatchmakingService,
    private readonly gameService: GameService,
    private readonly auth: AuthService,
    private readonly presence: PresenceService,
  ) {}

  afterInit(server: Server) {
    server.use(async (client, next) => {
      try {
        const token = client.handshake.auth?.token;
        if (typeof token !== 'string' || !token) throw new Error('Thiếu token');
        const user = await this.auth.getUser(token);
        client.data.userId = user.id;
        client.data.username = user.user_metadata?.username || user.email?.split('@')[0] || 'Kỳ thủ';
        next();
      } catch {
        next(new Error('Cần đăng nhập để chơi PvP'));
      }
    });
  }

  handleConnection(client: Socket) {
    this.presence.connect(client, client.data.userId, client.data.username, this.server);
  }

  @SubscribeMessage('matchmaking:join')
  async handleJoinQueue(
    @MessageBody() payload: { rating?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.matchmakingService.joinQueue(
      client.data.userId,
      payload.rating ?? 1000,
      client.id,
    );

    if (result.status === 'MATCHED' && result.match) {
      const { gameId, whitePlayer, blackPlayer, gameState } = result.match;
      await this.gameService.flushGame(gameId);

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
  handleLeaveQueue(@ConnectedSocket() client: Socket) {
    return this.matchmakingService.leaveQueue(client.data.userId);
  }

  handleDisconnect(client: Socket) {
    this.matchmakingService.handleSocketDisconnect(client.id);
    this.presence.disconnect(client.id, this.server);
  }
}
