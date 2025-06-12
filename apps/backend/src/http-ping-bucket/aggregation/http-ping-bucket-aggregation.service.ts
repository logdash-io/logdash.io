import { Injectable } from '@nestjs/common';
import { addHours, subDays, subHours } from 'date-fns';
import { ClickhouseUtils } from 'src/clickhouse/clickhouse.utils';
import { HttpPingAggregationService } from 'src/http-ping/aggregation/http-ping-aggregation.service';
import {
  HttpPingBucketNormalized,
  HttpPingBucketSerialized,
} from '../core/entities/http-ping-bucket.interface';
import { HttpPingBucketSerializer } from '../core/entities/http-ping-bucket.serializer';
import { BucketGrouping, HttpPingBucketReadService } from '../read/http-ping-bucket-read.service';

@Injectable()
export class HttpPingBucketAggregationService {
  constructor(
    private readonly httpPingAggregationService: HttpPingAggregationService,
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
    const nowMinusDays = (days: number) => {
      return subDays(new Date(), days);
    };

    const configs = {
      '24h': {
        fromDate: addHours(nowMinusDays(1), 1),
        grouping: BucketGrouping.Hour,
        expectedBucketCount: 24,
      },
      '4d': {
        fromDate: addHours(nowMinusDays(4), 1),
        grouping: BucketGrouping.Hour,
        expectedBucketCount: 96,
      },
      '90d': {
        fromDate: nowMinusDays(89),
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

    const mostRecentBuckets = await this.httpPingAggregationService.aggregatePingsForTimeRange(
      fromDateForMostRecent,
      toDate,
    );

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
}
