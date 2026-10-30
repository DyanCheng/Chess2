import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
constructor(private readonly jwtService: JwtService) {}

canActivate(context: ExecutionContext): boolean {
const client: Socket = context.switchToWs().getClient();
const token =
  client.handshake.auth?.token ||
  client.handshake.headers?.authorization?.split(' ')[1];

if (!token) {
  throw new WsException('Thiếu xác thực WebSocket');
}

try {
  const payload = this.jwtService.verify(token);
  client.data.user = payload;
  return true;
} catch {
  throw new WsException('Token WebSocket không hợp lệ');
}
}
}
