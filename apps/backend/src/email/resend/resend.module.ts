import { Module } from '@nestjs/common';
import { ResendService } from './resend.service';
import { LogdashModule } from '../../shared/logdash/logdash.module';

@Module({
  imports: [LogdashModule],
  providers: [ResendService],
})
export class ResendModule {}
