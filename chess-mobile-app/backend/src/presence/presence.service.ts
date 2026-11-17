import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export type PresenceStatus = 'online' | 'in_room' | 'in_game';

interface Presence {
  userId: string;
  username: string;
  socketId: string;
  status: PresenceStatus;
  roomId?: string;
  gameId?: string;
}

@Injectable()
export class PresenceService {
  private readonly users = new Map<string, Presence>();
  private readonly socketUsers = new Map<string, string>();

  connect(socket: Socket, userId: string, username: string, server: Server) {
    this.users.set(userId, { userId, username, socketId: socket.id, status: 'online' });
    this.socketUsers.set(socket.id, userId);
    this.broadcast(server);
  }

  disconnect(socketId: string, server: Server) {
    const userId = this.socketUsers.get(socketId);
    this.socketUsers.delete(socketId);
    if (userId && this.users.get(userId)?.socketId === socketId) this.users.delete(userId);
    this.broadcast(server);
  }

  update(userId: string, status: PresenceStatus, details: { roomId?: string; gameId?: string }, server: Server) {
    const presence = this.users.get(userId);
    if (!presence) return;
    Object.assign(presence, details, { status });
    this.broadcast(server);
  }

  list() {
    return [...this.users.values()].map(({ socketId: _socketId, ...presence }) => presence);
  }

  private broadcast(server: Server) {
    server.emit('presence:updated', { count: this.users.size, users: this.list() });
  }
}
