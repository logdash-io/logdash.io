import { Module } from '@nestjs/common';
import { LogRateLimitService } from './log-rate-limit.service';
import { ProjectReadModule } from '../../project/read/project-read.module';

@Module({
  imports: [ProjectReadModule],
  providers: [LogRateLimitService],
  exports: [LogRateLimitService],
})
export class LogRateLimitModule {}
