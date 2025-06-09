import { ClickHouseClient } from '@clickhouse/client';
import { Injectable } from '@nestjs/common';
import { addHours, subDays, subHours } from 'date-fns';
import { ClickhouseUtils } from 'src/clickhouse/clickhouse.utils';
import { HttpPingBucketEntity } from '../core/entities/http-ping-bucket.entity';
import {
  HttpPingBucketNormalized,
  HttpPingBucketSerialized,
} from '../core/entities/http-ping-bucket.interface';
import { HttpPingBucketSerializer } from '../core/entities/http-ping-bucket.serializer';
import { BucketGrouping, HttpPingBucketReadService } from '../read/http-ping-bucket-read.service';

@Injectable()
export class HttpPingBucketAggregateService {
  constructor(
    private readonly clickhouse: ClickHouseClient,
    private readonly httpPingBucketReadService: HttpPingBucketReadService,
  ) {}

  public async getBucketsForMonitor(
    monitorId: string,
    period: '24h' | '4d' | '90d' = '24h',
  ): Promise<(HttpPingBucketSerialized | null)[]> {
    const periodConfig = this.getPeriodConfig(period);

    const existingBuckets = await this.httpPingBucketReadService.readBucketsForMonitor(
      monitorId,
      periodConfig.fromDate,
      periodConfig.grouping,
    );

    const completeBuckets = await this.createCompleteBuckets(
      existingBuckets,
      periodConfig.fromDate,
      periodConfig.grouping,
      periodConfig.expectedBucketCount,
    );

    return completeBuckets.map((bucket) =>
      bucket ? HttpPingBucketSerializer.serialize(bucket) : null,
    );
  }

  private getPeriodConfig(period: '24h' | '4d' | '90d') {
    const subtractDaysUtc = (days: number) => {
      return subDays(new Date(), days);
    };

    const configs = {
      '24h': {
        fromDate: addHours(subtractDaysUtc(1), 1),
        grouping: BucketGrouping.Hour,
        expectedBucketCount: 24,
      },
      '4d': {
        fromDate: addHours(subtractDaysUtc(4), 1),
        grouping: BucketGrouping.Hour,
        expectedBucketCount: 96,
      },
      '90d': {
        fromDate: subtractDaysUtc(89),
        grouping: BucketGrouping.Day,
        expectedBucketCount: 90,
      },
    };

    return configs[period];
  }

  private async createCompleteBuckets(
    existingBuckets: HttpPingBucketNormalized[],
    fromDate: Date,
    grouping: BucketGrouping,
    expectedBucketCount: number,
  ): Promise<(HttpPingBucketNormalized | null)[]> {
    const completeBuckets = HttpPingBucketNormalized.fromExisting(
      existingBuckets,
      fromDate,
      grouping,
      expectedBucketCount,
    );

    if (completeBuckets[0] === null) {
      completeBuckets[0] = await this.tryAddVirtualBucket(grouping);
    }

    return completeBuckets;
  }

  private async tryAddVirtualBucket(
    grouping: BucketGrouping,
  ): Promise<HttpPingBucketNormalized | null> {
    const toDate = addHours(new Date(), 1);
    toDate.setMinutes(0, 0);
    const fromDateForMostRecent = subHours(toDate, 1);
    const isDailyGrouping = grouping === BucketGrouping.Day;

    if (isDailyGrouping) {
      fromDateForMostRecent.setUTCHours(0, 0, 0, 0);
    }

    const mostRecentBuckets = await this.aggregatePingsForTimeRange(fromDateForMostRecent, toDate);

    if (mostRecentBuckets.length === 0) {
      return null;
    }

    return HttpPingBucketSerializer.normalize({
      id: '',
      http_monitor_id: mostRecentBuckets[0].http_monitor_id,
      success_count: mostRecentBuckets[0].success_count,
      failure_count: mostRecentBuckets[0].failure_count,
      average_latency_ms: mostRecentBuckets[0].average_latency_ms,
      hour_timestamp: isDailyGrouping
        ? ClickhouseUtils.jsDateToClickhouseDate(fromDateForMostRecent)
        : mostRecentBuckets[0].hour_timestamp,
    });
  }

  public async aggregatePingsForTimeRange(
    startTime: Date,
    endTime: Date,
  ): Promise<Omit<HttpPingBucketEntity, 'id'>[]> {
    const aggregationResult = await this.clickhouse.query({
      query: `
        SELECT 
          http_monitor_id,
          toStartOfHour(created_at) as hour_timestamp,
          countIf(status_code >= 200 AND status_code < 400) as success_count,
          countIf(status_code >= 400 OR status_code = 0) as failure_count,
          avg(response_time_ms) as average_latency_ms
        FROM http_pings 
        WHERE created_at >= {startTime:DateTime64(3)}
          AND created_at < {endTime:DateTime64(3)}
        GROUP BY http_monitor_id, toStartOfHour(created_at)
        HAVING success_count + failure_count > 0
      `,
      query_params: {
        startTime: ClickhouseUtils.jsDateToClickhouseDate(startTime),
        endTime: ClickhouseUtils.jsDateToClickhouseDate(endTime),
      },
    });

    return ((await aggregationResult.json()) as any).data as Omit<HttpPingBucketEntity, 'id'>[];
  }
}
