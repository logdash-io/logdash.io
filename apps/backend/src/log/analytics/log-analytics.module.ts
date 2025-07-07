import { Module } from '@nestjs/common';
import { LogAnalyticsService } from './log-analytics.service';
import { LogAnalyticsDateAlignmentService } from './log-analytics-date-alignment.service';
import { LogAnalyticsBucketSelectionService } from './log-analytics-bucket-selection.service';

@Module({
  providers: [
    LogAnalyticsService,
    LogAnalyticsDateAlignmentService,
    LogAnalyticsBucketSelectionService,
  ],
  exports: [
    LogAnalyticsService,
    LogAnalyticsDateAlignmentService,
    LogAnalyticsBucketSelectionService,
  ],
})
export class LogAnalyticsModule {}
