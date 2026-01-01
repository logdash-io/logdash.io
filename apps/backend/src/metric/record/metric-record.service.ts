import { Inject, Injectable } from '@nestjs/common';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';
import { MetricWriteClickhouseService } from '../write/metric-write.clickhouse-service';
import { Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { METRICS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { AverageRecorder } from '../../shared/logdash/average-metric-recorder.service';

@Injectable()
export class MetricRecordService {
  constructor(
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly metricWriteClickhouseService: MetricWriteClickhouseService,
    @Inject(METRICS_LOGGER) private readonly logger: LogdashLogger,
    private readonly averageRecorder: AverageRecorder,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  private async runCron(): Promise<void> {
    try {
      await this.recordMetrics();
    } catch (error) {
      this.logger.error('Error recording clickhouse metrics', {
        error: error.message,
      });
    }
  }

  public async recordMetrics(): Promise<void> {
    const start = performance.now();

    const metricRegisterEntriesToRecord =
      await this.metricRegisterReadService.readMetricRegisterEntriesToRecord();

    await this.metricWriteClickhouseService.recordMetrics(
      metricRegisterEntriesToRecord.map((entry) => ({
        id: new Types.ObjectId().toString(),
        metricRegisterEntryId: entry.metricRegisterEntryId,
        recordedAt: new Date(),
        value: entry.value,
      })),
    );

    const end = performance.now();
    const durationMs = end - start;

    // todo: add metrics alerting for the clickhouse_metrics_recording_ms
    // this.logger.info('Recorded clickhouse metrics', {
    //   durationMs,
    // });

    this.averageRecorder.record('clickhouse_metrics_recording_ms', durationMs);
  }
}
