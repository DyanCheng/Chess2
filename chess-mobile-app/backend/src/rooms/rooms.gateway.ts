import { ConnectedSocket, MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PresenceService } from '../presence/presence.service';
import { RoomService } from './room.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly rooms: RoomService, private readonly presence: PresenceService) {}

  handleDisconnect(client: Socket) {
    if (!client.data.currentRoomId || !client.data.userId) return;
    this.publishLeave(client.data.currentRoomId, client.data.userId);
  }

  @SubscribeMessage('room:list')
  list() {
    return { data: this.rooms.listPublic() };
  }

  @SubscribeMessage('room:create')
  create(@ConnectedSocket() client: Socket, @MessageBody() payload: Record<string, unknown>) {
    try {
      const room = this.rooms.create({
        hostId: client.data.userId,
        hostUsername: client.data.username,
        name: payload?.name as string,
        isPrivate: payload?.isPrivate as boolean,
        password: payload?.password as string,
        timeControlMinutes: payload?.timeControlMinutes as number,
      });
      client.join(room.id);
      client.data.currentRoomId = room.id;
      this.presence.update(client.data.userId, 'in_room', { roomId: room.id }, this.server);
      this.server.emit('room:list_updated');
      return { data: this.rooms.memberView(room) };
    } catch (error: any) {
      return { error: error?.message || 'Không tạo được phòng' };
    }
  }

  @SubscribeMessage('room:join')
  join(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomIdOrCode: string; password?: string }) {
    try {
      const result = this.rooms.join({ ...payload, userId: client.data.userId, username: client.data.username });
      client.join(result.room.id);
      client.data.currentRoomId = result.room.id;
      this.presence.update(client.data.userId, 'in_room', { roomId: result.room.id }, this.server);
      const safeRoom = this.rooms.memberView(result.room);
      this.server.to(result.room.id).emit('room:updated', safeRoom);
      this.server.emit('room:list_updated');
      return { data: { ...result, room: safeRoom } };
    } catch (error: any) {
      return { error: error?.message || 'Không vào được phòng' };
    }
  }

  @SubscribeMessage('room:ready')
  ready(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string; ready: boolean }) {
    try {
      const room = this.rooms.ready(payload.roomId, client.data.userId, payload.ready);
      const safeRoom = this.rooms.memberView(room);
      this.server.to(room.id).emit('room:updated', safeRoom);
      return { data: safeRoom };
    } catch (error: any) {
      return { error: error?.message || 'Không cập nhật được trạng thái' };
    }
  }

  @SubscribeMessage('room:start')
  async start(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }) {
    try {
      const result = this.rooms.start(payload.roomId, client.data.userId);
      await this.server.in(result.room.id).socketsJoin(result.room.gameId);
      if (result.room.whitePlayer) {
        this.presence.update(result.room.whitePlayer.userId, 'in_game', { gameId: result.room.gameId }, this.server);
      }
      if (result.room.blackPlayer) {
        this.presence.update(result.room.blackPlayer.userId, 'in_game', { gameId: result.room.gameId }, this.server);
      }
      const safeResult = { ...result, room: this.rooms.memberView(result.room) };
      this.server.to(result.room.id).emit('room:game_started', safeResult);
      this.server.emit('room:list_updated');
      return { data: safeResult };
    } catch (error: any) {
      return { error: error?.message || 'Không bắt đầu được trận đấu' };
    }
  }

  @SubscribeMessage('room:leave')
  leave(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }) {
    client.leave(payload.roomId);
    delete client.data.currentRoomId;
    this.presence.update(client.data.userId, 'online', {}, this.server);
    return this.publishLeave(payload.roomId, client.data.userId);
  }

  @SubscribeMessage('room:chat')
  chat(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string; text: string }) {
    try {
      const message = this.rooms.message(payload.roomId, client.data.userId, client.data.username, payload.text);
      this.server.to(payload.roomId).emit('room:chat_message', { message });
      return { data: message };
    } catch (error: any) {
      return { error: error?.message || 'Không gửi được tin nhắn' };
    }
  }

  @SubscribeMessage('presence:get_online')
  online() {
    const users = this.presence.list();
    return { count: users.length, users };
  }

  private publishLeave(roomId: string, userId: string) {
    const result = this.rooms.leave(roomId, userId);
    if (result.closed) this.server.to(roomId).emit('room:closed', { roomId });
    else if (result.room) this.server.to(roomId).emit('room:updated', this.rooms.memberView(result.room));
    this.server.emit('room:list_updated');
    return { data: result };
  }
}
