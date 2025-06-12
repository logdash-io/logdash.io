import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subHours } from 'date-fns';
import {
  HttpPingAggregationService,
  PingsAggregation,
} from 'src/http-ping/aggregation/http-ping-aggregation.service';
import { CreateHttpPingBucketDto } from '../write/dto/create-http-ping-bucket.dto';
import { HttpPingBucketWriteService } from '../write/http-ping-bucket-write.service';

@Injectable()
export class HttpPingBucketIngestionService {
  constructor(
    private readonly httpPingAggregationService: HttpPingAggregationService,
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
    now.setMinutes(0, 0, 0);
    const previousHourStart = subHours(now, 1);
    const previousHourEnd = now;

    const data = await this.httpPingAggregationService.aggregatePingsForTimeRange(
      previousHourStart,
      previousHourEnd,
    );

    if (data.length === 0) {
      this.logger.log('No pings found for bucketing in previous hour');
      return;
    }

    /*
     TODO: 
      - if performance is bad, consider placing this operation in within the database
      - currently we fetch data from the database, do some operations on it and then put it back in the database
     */
    const bucketDtos: CreateHttpPingBucketDto[] = data.map((result: PingsAggregation) => ({
      httpMonitorId: result.http_monitor_id,
      timestamp: result.hour_timestamp,
      successCount: result.success_count,
      failureCount: result.failure_count,
      averageLatencyMs: Number(result.average_latency_ms.toFixed(2)),
    }));

    await this.httpPingBucketWriteService.createMany(bucketDtos);

    this.logger.log(`Created HTTP ping buckets for previous hour`, {
      rangeStart: previousHourStart.toISOString(),
      rangeEnd: previousHourEnd.toISOString(),
      bucketsCreated: bucketDtos.length,
    });
  }
}
