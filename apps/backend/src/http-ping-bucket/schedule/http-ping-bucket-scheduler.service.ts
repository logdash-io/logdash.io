import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { HttpPingBucketAggregationService } from '../aggregation/http-ping-bucket-aggregation.service';
import { HttpPingBucketEntity } from '../core/entities/http-ping-bucket.entity';
import { CreateHttpPingBucketDto } from '../write/dto/create-http-ping-bucket.dto';
import { HttpPingBucketWriteService } from '../write/http-ping-bucket-write.service';

@Injectable()
export class HttpPingBucketSchedulerService {
  constructor(
    private readonly httpPingBucketAggregateService: HttpPingBucketAggregationService,
    private readonly httpPingBucketWriteService: HttpPingBucketWriteService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  public async createBucketsForPreviousHour(): Promise<void> {
    try {
      await this.aggregatePingsIntoBuckets();
    } catch (error) {
      this.logger.error('Error creating HTTP ping buckets:', { errorMessage: error.message });
    }
  }

  private async aggregatePingsIntoBuckets(): Promise<void> {
    const now = new Date();
    const previousHourStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() - 1,
    );
    const previousHourEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
    );

    const data = await this.httpPingBucketAggregateService.aggregatePingsForTimeRange(
      previousHourStart,
      previousHourEnd,
    );

    if (data.length === 0) {
      this.logger.log('No pings found for bucketing in previous hour');
      return;
    }

    const bucketDtos: CreateHttpPingBucketDto[] = data.map(
      (result: Omit<HttpPingBucketEntity, 'id'>) => ({
        httpMonitorId: result.http_monitor_id,
        timestamp: ClickhouseUtils.clickhouseDateToJsDate(result.hour_timestamp),
        successCount: result.success_count,
        failureCount: result.failure_count,
        averageLatencyMs: Number(result.average_latency_ms.toFixed(2)),
      }),
    );

    await this.httpPingBucketWriteService.createMany(bucketDtos);

    this.logger.log(`Created ${bucketDtos.length} HTTP ping buckets for previous hour`, {
      timestamp: previousHourStart.toISOString(),
      bucketsCreated: bucketDtos.length,
    });
  }
}
