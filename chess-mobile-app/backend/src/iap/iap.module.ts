import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IapController } from './iap.controller';
import { IapService } from './iap.service';

@Module({
  imports: [AuthModule],
  controllers: [IapController],
  providers: [IapService],
})
export class IapModule {}
