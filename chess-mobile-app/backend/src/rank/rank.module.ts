import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RankController } from './rank.controller';

@Module({ imports: [AuthModule], controllers: [RankController] })
export class RankModule {}
