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

  constructor(private readonly gameService: GameService) {}

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.gameService.handleDisconnect(client.data.userId, this.server);
    }
  }

  @SubscribeMessage('game:create_bot')
  handleCreateBotGame(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      difficulty?: 'EASY' | 'MEDIUM' | 'easy' | 'medium';
      initialHp?: number;
    },
  ) {
    const playerId = client.data.userId;
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
    @MessageBody() payload: { gameId: string },
  ) {
    const playerId = client.data.userId;
    client.join(payload.gameId);
    this.gameService.handleReconnect(playerId, this.server);
    const session = this.gameService.joinGame(payload.gameId, playerId);
    const serialized = this.gameService.serializeGame(session);
    this.server.to(payload.gameId).emit('game:state', serialized);
    this.server.to(payload.gameId).emit('game:updated', serialized);
    return { event: 'game:joined', data: serialized };
  }

  @SubscribeMessage('game:move')
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MoveDto | { gameId: string; move: Omit<MoveDto, 'playerId'> },
  ) {
    const nested = 'move' in payload ? payload.move : payload;
    const gameId = payload.gameId || nested.gameId;
    const result = this.gameService.makeMove({
      ...nested,
      gameId,
      playerId: client.data.userId,
    }, this.server);
    await this.gameService.flushGame(gameId);
    this.server.to(gameId).emit('game:updated', result);
    return { event: 'game:move_ack', data: result };
  }

  @SubscribeMessage('game:bot_move')
  handleBotMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string },
  ) {
    this.gameService.getGameStateForPlayer(payload.gameId, client.data.userId);
    const result = this.gameService.makeBotMove(payload.gameId, this.server);
    return { event: 'game:bot_move_ack', data: result };
  }

  @SubscribeMessage('game:resign')
  async handleResign(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string },
  ) {
    const session = this.gameService.resignGame(
      payload.gameId,
      client.data.userId,
      this.server,
    );
    await this.gameService.flushGame(payload.gameId);
    const serialized = this.gameService.serializeGame(session);
    this.server.to(payload.gameId).emit('game:updated', serialized);
    return {
      event: 'game:finished',
      data: serialized,
    };
  }

  @SubscribeMessage('game:sync_state')
  handleSyncState(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string },
  ) {
    this.gameService.handleReconnect(client.data.userId, this.server);
    const serialized = this.gameService.getGameStateForPlayer(
      payload.gameId,
      client.data.userId,
    );
    client.emit('game:state', serialized);
    client.emit('game:updated', serialized);
    return { event: 'game:state', data: serialized };
  }
}
