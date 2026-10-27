import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { MoveDto } from './dto/move.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly socketPlayerMap = new Map<string, string>();

  constructor(private readonly gameService: GameService) {}

  handleDisconnect(client: Socket) {
    const playerId = this.socketPlayerMap.get(client.id) || client.id;
    this.gameService.handleDisconnect(playerId, this.server);
    this.socketPlayerMap.delete(client.id);
  }

  @SubscribeMessage('game:create_bot')
  handleCreateBotGame(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      playerId?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'easy' | 'medium';
      initialHp?: number;
    },
  ) {
    const playerId = payload?.playerId || client.id;
    this.socketPlayerMap.set(client.id, playerId);
    const session = this.gameService.createBotGame(
      playerId,
      payload?.difficulty || 'EASY',
      payload?.initialHp ?? 100,
    );
    client.join(session.id);
    const serialized = this.gameService.serializeGame(session);
    client.emit('game:state', serialized);
    return { event: 'game:created', data: serialized };
  }

  @SubscribeMessage('game:join')
  handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string; playerId: string },
  ) {
    this.socketPlayerMap.set(client.id, payload.playerId);
    client.join(payload.gameId);
    this.gameService.handleReconnect(payload.playerId, this.server);
    const session = this.gameService.joinGame(payload.gameId, payload.playerId);
    const serialized = this.gameService.serializeGame(session);
    this.server.to(payload.gameId).emit('game:state', serialized);
    return { event: 'game:joined', data: serialized };
  }

  @SubscribeMessage('game:move')
  handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: MoveDto,
  ) {
    const result = this.gameService.makeMove(dto, this.server);
    return { event: 'game:move_ack', data: result };
  }

  @SubscribeMessage('game:bot_move')
  handleBotMove(
    @MessageBody() payload: { gameId: string },
  ) {
    const result = this.gameService.makeBotMove(payload.gameId, this.server);
    return { event: 'game:bot_move_ack', data: result };
  }

  @SubscribeMessage('game:resign')
  handleResign(
    @MessageBody() payload: { gameId: string; playerId: string },
  ) {
    const session = this.gameService.resignGame(
      payload.gameId,
      payload.playerId,
      this.server,
    );
    return {
      event: 'game:finished',
      data: this.gameService.serializeGame(session),
    };
  }

  @SubscribeMessage('game:sync_state')
  handleSyncState(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string; playerId?: string },
  ) {
    if (payload.playerId) {
      this.socketPlayerMap.set(client.id, payload.playerId);
      this.gameService.handleReconnect(payload.playerId, this.server);
    }
    const session = this.gameService.getGameOrThrow(payload.gameId);
    const serialized = this.gameService.serializeGame(session);
    client.emit('game:state', serialized);
    return { event: 'game:state', data: serialized };
  }
}