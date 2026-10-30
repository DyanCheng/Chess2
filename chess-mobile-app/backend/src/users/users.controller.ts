import { Body, Controller, Get, Headers, Put } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { accessTokenFromHeader } from '../auth/token';

@Controller('player')
export class UsersController {
  constructor(private readonly auth: AuthService) {}

  @Get('profile')
  profile(@Headers('authorization') authorization?: string) {
    return this.auth.getProfile(accessTokenFromHeader(authorization));
  }

  @Put('profile')
  updateProfile(@Headers('authorization') authorization: string, @Body() body: { username: string }) {
    return this.auth.updateProfile(accessTokenFromHeader(authorization), body?.username);
  }
}
