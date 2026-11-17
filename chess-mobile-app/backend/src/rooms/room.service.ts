import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GameService } from '../game/game.service';

export interface RoomPlayer {
  userId: string;
  username: string;
  color: 'w' | 'b';
  ready: boolean;
}

export interface CustomRoom {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostUsername: string;
  isPrivate: boolean;
  password?: string;
  timeControlMinutes: number;
  status: 'waiting' | 'ready' | 'playing';
  whitePlayer: RoomPlayer | null;
  blackPlayer: RoomPlayer | null;
  gameId?: string;
  messages: Array<{ id: string; senderId: string; senderName: string; text: string; timestamp: number }>;
  createdAt: number;
}

@Injectable()
export class RoomService {
  private readonly rooms = new Map<string, CustomRoom>();

  constructor(private readonly games: GameService) {}

  create(input: {
    hostId: string;
    hostUsername: string;
    name?: string;
    isPrivate?: boolean;
    password?: string;
    timeControlMinutes?: number;
  }) {
    const timeControlMinutes = [3, 5, 10].includes(Number(input.timeControlMinutes))
      ? Number(input.timeControlMinutes)
      : 5;
    const room: CustomRoom = {
      id: randomUUID(),
      code: this.uniqueCode(),
      name: input.name?.trim().slice(0, 40) || `Phòng của ${input.hostUsername}`,
      hostId: input.hostId,
      hostUsername: input.hostUsername,
      isPrivate: Boolean(input.isPrivate),
      password: input.isPrivate ? input.password?.trim().slice(0, 40) : undefined,
      timeControlMinutes,
      status: 'waiting',
      whitePlayer: { userId: input.hostId, username: input.hostUsername, color: 'w', ready: true },
      blackPlayer: null,
      messages: [],
      createdAt: Date.now(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  listPublic() {
    return [...this.rooms.values()]
      .filter(room => !room.isPrivate && room.status !== 'playing')
      .map(room => this.publicView(room));
  }

  join(input: { roomIdOrCode: string; userId: string; username: string; password?: string }) {
    const room = this.find(input.roomIdOrCode);
    if (room.status === 'playing') throw new BadRequestException('Ván đấu đã bắt đầu');
    if (room.isPrivate && room.password && room.password !== input.password) {
      throw new ForbiddenException('Mật khẩu phòng không đúng');
    }
    if (room.whitePlayer?.userId === input.userId) return { room, color: 'w' as const };
    if (room.blackPlayer?.userId === input.userId) return { room, color: 'b' as const };
    if (room.blackPlayer) throw new BadRequestException('Phòng đã đủ người chơi');
    room.blackPlayer = { userId: input.userId, username: input.username, color: 'b', ready: false };
    this.refreshStatus(room);
    return { room, color: 'b' as const };
  }

  ready(roomId: string, userId: string, ready: boolean) {
    const room = this.find(roomId);
    const player = room.whitePlayer?.userId === userId ? room.whitePlayer
      : room.blackPlayer?.userId === userId ? room.blackPlayer : null;
    if (!player) throw new ForbiddenException('Bạn không thuộc phòng này');
    player.ready = Boolean(ready);
    this.refreshStatus(room);
    return room;
  }

  start(roomId: string, userId: string) {
    const room = this.find(roomId);
    if (room.hostId !== userId) throw new ForbiddenException('Chỉ chủ phòng được bắt đầu');
    if (!room.whitePlayer || !room.blackPlayer || !room.whitePlayer.ready || !room.blackPlayer.ready) {
      throw new BadRequestException('Cần đủ hai người và cả hai phải sẵn sàng');
    }
    const game = this.games.createGame({
      whitePlayerId: room.whitePlayer.userId,
      blackPlayerId: room.blackPlayer.userId,
      initialTimeMs: room.timeControlMinutes * 60_000,
      initialHp: 100,
      mode: 'PVP',
    });
    room.status = 'playing';
    room.gameId = game.id;
    return { room, game: { ...this.games.serializeGame(game), gameId: game.id } };
  }

  leave(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return { closed: false, room: null };
    if (room.status === 'playing' || room.hostId === userId) {
      this.rooms.delete(room.id);
      return { closed: true, room: null };
    }
    if (room.blackPlayer?.userId === userId) room.blackPlayer = null;
    this.refreshStatus(room);
    return { closed: false, room };
  }

  message(roomId: string, userId: string, username: string, rawText: string) {
    const room = this.find(roomId);
    const isMember = room.whitePlayer?.userId === userId || room.blackPlayer?.userId === userId;
    if (!isMember) throw new ForbiddenException('Bạn không thuộc phòng này');
    const text = rawText?.trim().slice(0, 200);
    if (!text) throw new BadRequestException('Tin nhắn trống');
    const message = { id: randomUUID(), senderId: userId, senderName: username, text, timestamp: Date.now() };
    room.messages.push(message);
    room.messages = room.messages.slice(-50);
    return message;
  }

  publicView(room: CustomRoom) {
    const { password: _password, messages: _messages, ...safe } = room;
    return safe;
  }

  memberView(room: CustomRoom) {
    const { password: _password, ...safe } = room;
    return safe;
  }

  private find(idOrCode: string) {
    const normalized = String(idOrCode || '').trim().toUpperCase();
    const room = this.rooms.get(idOrCode) || [...this.rooms.values()].find(item => item.code === normalized);
    if (!room) throw new NotFoundException('Không tìm thấy phòng');
    return room;
  }

  private refreshStatus(room: CustomRoom) {
    room.status = room.whitePlayer?.ready && room.blackPlayer?.ready ? 'ready' : 'waiting';
  }

  private uniqueCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    } while ([...this.rooms.values()].some(room => room.code === code));
    return code;
  }
}
