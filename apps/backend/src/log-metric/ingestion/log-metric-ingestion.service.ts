import { Injectable } from '@nestjs/common';
import { LogMetricWriteService } from '../write/log-metric-write.service';
import { RecordLogMetricDto } from '../core/dto/record-log-metric.dto';
import { UpsertLogMetricDto } from '../write/dto/upsert-log-metric.dto';
import { MetricBucketingService } from '../../metric-shared/bucketing/metric-bucketing.service';
import { LogMetricAggregationService } from './log-metric-aggregation-service';
import { LogMetricEventEmitter } from '../events/log-metric-event.emitter';
import { Types } from 'mongoose';
import { parseFlexibleDate } from '../../shared/utils/parse-flexible-date';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { AverageRecorder } from '../../shared/logdash/average-metric-recorder.service';
@Injectable()
export class LogMetricIngestionService {
  constructor(
    private readonly logMetricWriteService: LogMetricWriteService,
    private readonly logMetricAggregationService: LogMetricAggregationService,
    private readonly logMetricEventEmitter: LogMetricEventEmitter,
    private readonly averageRecorder: AverageRecorder,
  ) {}

  public async recordLogsMetrics(dtos: RecordLogMetricDto[]): Promise<void> {
    const currentTime = Date.now();

    const upsertDtos: UpsertLogMetricDto[] = [];

    for (const dto of dtos) {
      const bucketedDates = MetricBucketingService.splitDateToBuckets(dto.date);

      upsertDtos.push(
        ...bucketedDates.map((bucket) => ({
          id: new Types.ObjectId().toString(),
          granularity: bucket.granularity,
          timeBucket: bucket.dateGranular,
          values: dto.values,
          projectId: dto.projectId,
        })),
      );
    }

    const simplifiedDtos =
      this.logMetricAggregationService.aggregate(upsertDtos);

    this.logMetricEventEmitter.emitLogMetricCreatedEvents(
      simplifiedDtos.map((dto) => ({
        date:
          dto.granularity === MetricGranularity.AllTime
            ? 'all-time'
            : parseFlexibleDate(dto.timeBucket).toISOString(),
        projectId: dto.projectId,
        granularity: dto.granularity,
        id: new Types.ObjectId().toString(),
        values: dto.values,
      })),
    );

    await this.logMetricWriteService.upsertMany(simplifiedDtos);

    const durationMs = Date.now() - currentTime;

    this.averageRecorder.record('logMetricsCreationDurationMs', durationMs);
  }
}
