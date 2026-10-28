import { UnauthorizedException } from '@nestjs/common';

export function accessTokenFromHeader(header?: string): string {
  const match = /^Bearer\s+([^\s]+)$/i.exec(header || '');
  if (!match) throw new UnauthorizedException('Thiếu Bearer token');
  return match[1];
}
