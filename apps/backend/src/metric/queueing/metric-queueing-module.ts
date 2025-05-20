import { Module } from '@nestjs/common';
import { MetricQueueingService } from './metric-queueing-service';
import { MetricIngestionModule } from '../ingestion/metric-ingestion.module';
import { MetricAggregationService } from './metric-aggregation.service';

@Module({
  imports: [MetricIngestionModule],
  providers: [MetricQueueingService, MetricAggregationService],
  exports: [MetricQueueingService],
})
export class MetricQueueingModule {}
