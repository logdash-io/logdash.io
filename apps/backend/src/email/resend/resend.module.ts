import { Module } from '@nestjs/common';
import { ResendService } from './resend.service';
import { LogdashModule } from '../../shared/logdash/logdash.module';
import { ResendTemplatedEmailsService } from './resend-templated-emails.service';
import { UserReadModule } from '../../user/read/user-read.module';

@Module({
  imports: [LogdashModule, UserReadModule],
  providers: [ResendService, ResendTemplatedEmailsService],
})
export class ResendModule {}
