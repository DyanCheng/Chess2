import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PuzzlesController } from './puzzles.controller';

@Module({ imports: [AuthModule], controllers: [PuzzlesController] })
export class PuzzlesModule {}
