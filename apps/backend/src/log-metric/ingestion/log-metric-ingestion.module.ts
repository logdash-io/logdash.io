import { Module } from '@nestjs/common';
import { LogMetricIngestionService } from './log-metric-ingestion.service';
import { LogMetricWriteModule } from '../write/log-metric-write.module';
import { LogMetricAggregationService } from './log-metric-aggregation-service';
import { LogMetricEventModule } from '../events/log-metric-event.module';

@Module({
  imports: [LogMetricWriteModule, LogMetricEventModule],
  providers: [LogMetricIngestionService, LogMetricAggregationService],
  exports: [LogMetricIngestionService],
})
export class LogMetricIngestionModule {}
