import { Module } from '@nestjs/common';
import { GameModule } from '../game/game.module';
import { PresenceModule } from '../presence/presence.module';
import { RoomService } from './room.service';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';

@Module({
  imports: [GameModule, PresenceModule],
  controllers: [RoomsController],
  providers: [RoomService, RoomsGateway],
})
export class RoomsModule {}
