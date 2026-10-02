import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';

@Module({
  imports: [GameModule], // Nhúng GameModule vào app
  controllers: [],
  providers: [],
})
export class AppModule {}