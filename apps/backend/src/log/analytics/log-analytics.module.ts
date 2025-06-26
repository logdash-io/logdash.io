import { Module } from '@nestjs/common';
import { LogAnalyticsService } from './log-analytics.service';

@Module({
  providers: [LogAnalyticsService],
  exports: [LogAnalyticsService],
})
export class LogAnalyticsModule {}
