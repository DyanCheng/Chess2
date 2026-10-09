import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    // TODO: Verify token via Supabase Auth
    // const user = await verify(token);
    
    // Fake user ID for development
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    client.data.userId = userId;
    
    console.log(`Client connected: ${client.id} (User: ${userId})`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.gameService.handleDisconnect(client.data.userId, this.server);
  }

  @SubscribeMessage('find_match')
  handleFindMatch(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    this.gameService.addToMatchmaking(userId, client, this.server);
  }

  @SubscribeMessage('cancel_match')
  handleCancelMatch(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    this.gameService.removeFromMatchmaking(userId);
  }

  @SubscribeMessage('make_move')
  handleMakeMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string; from: any; to: any }
  ) {
    const userId = client.data.userId;
    this.gameService.handleMove(userId, payload.gameId, payload.from, payload.to, this.server);
  }

  @SubscribeMessage('use_card')
  handleUseCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string; cardId: string; target?: any }
  ) {
    const userId = client.data.userId;
    this.gameService.handleCardUse(userId, payload.gameId, payload.cardId, payload.target, this.server);
  }

  @SubscribeMessage('resign')
  handleResign(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: string }
  ) {
    const userId = client.data.userId;
    this.gameService.handleResign(userId, payload.gameId, this.server);
  }
}
