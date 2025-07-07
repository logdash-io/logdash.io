import { Module } from '@nestjs/common';
import { ResendService } from './resend.service';
import { LogdashModule } from '../../shared/logdash/logdash.module';
import { ResendTemplatedEmailsService } from './resend-templated-emails.service';

@Module({
  imports: [LogdashModule],
  providers: [ResendService, ResendTemplatedEmailsService],
})
export class ResendModule {}
