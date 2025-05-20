import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecordMetricDto } from '../ingestion/dto/record-metric.dto';
import { MetricIngestionService } from '../ingestion/metric-ingestion.service';
import { MetricAggregationService } from './metric-aggregation.service';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class MetricQueueingService {
  constructor(
    private readonly metricIngestionService: MetricIngestionService,
    private readonly metricAggregationService: MetricAggregationService,
    private readonly logger: Logger,
  ) {}

  public queueMetric(dto: RecordMetricDto): void {
    this.metricAggregationService.save(dto);
  }

  public queueMetrics(dtos: RecordMetricDto[]): void {
    for (const dto of dtos) {
      this.queueMetric(dto);
    }
  }

  @Cron(CronExpression.EVERY_SECOND)
  public async processQueue(): Promise<void> {
    const aggregatedDtos = this.metricAggregationService.getAndClear();

    if (aggregatedDtos.length === 0) {
      return;
    }

    try {
      await this.metricIngestionService.recordMetrics(aggregatedDtos);
    } catch (error) {
      this.logger.error('Error while recording metrics', { errorMessage: error.message });
    }
  }
}
