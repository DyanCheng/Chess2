import { Controller, Get } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomService) {}

  @Get('public')
  publicRooms() {
    return { rooms: this.rooms.listPublic() };
  }
}
