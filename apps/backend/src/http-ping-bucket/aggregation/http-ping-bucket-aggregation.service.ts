import { Injectable } from '@nestjs/common';
import { addHours, subDays, subHours } from 'date-fns';
import { HttpPingAggregationService } from 'src/http-ping/aggregation/http-ping-aggregation.service';
import { HttpPingBucketSerialized } from '../core/entities/http-ping-bucket.interface';
import { BucketGrouping, HttpPingBucketReadService } from '../read/http-ping-bucket-read.service';
import { BucketsPeriod } from './types/bucket-period.enum';
import { VirtualBucket } from './types/virtual-bucket.type';

@Injectable()
export class HttpPingBucketAggregationService {
  constructor(
    private readonly httpPingAggregationService: HttpPingAggregationService,
    private readonly httpPingBucketReadService: HttpPingBucketReadService,
  ) {}

  public async getBucketsForMonitor(
    monitorId: string,
    period: BucketsPeriod,
  ): Promise<(HttpPingBucketSerialized | null)[]> {
    const periodConfig = this.getPeriodConfig(period);

    const existingBuckets = await this.httpPingBucketReadService.readBucketsForMonitor(
      monitorId,
      periodConfig.fromDate,
      periodConfig.grouping,
    );

    return await this.createCompleteBuckets(
      existingBuckets,
      periodConfig.fromDate,
      periodConfig.grouping,
      periodConfig.expectedBucketCount,
    );
  }

  private getPeriodConfig(period: BucketsPeriod) {
    const nowMinusDays = (days: number) => {
      return subDays(new Date(), days);
    };

    const configs = {
      [BucketsPeriod.Day]: {
        fromDate: addHours(nowMinusDays(1), 1),
        grouping: BucketGrouping.Hour,
        expectedBucketCount: 24,
      },
      [BucketsPeriod.FourDays]: {
        fromDate: addHours(nowMinusDays(4), 1),
        grouping: BucketGrouping.Hour,
        expectedBucketCount: 96,
      },
      [BucketsPeriod.NinetyDays]: {
        fromDate: nowMinusDays(89),
        grouping: BucketGrouping.Day,
        expectedBucketCount: 90,
      },
    };

    return configs[period];
  }

  private async createCompleteBuckets(
    existingBuckets: VirtualBucket[],
    fromDate: Date,
    grouping: BucketGrouping,
    expectedBucketCount: number,
  ): Promise<(VirtualBucket | null)[]> {
    const completeBuckets = this.fillWithEmptyBuckets(
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

  private fillWithEmptyBuckets(
    existingBuckets: VirtualBucket[],
    fromDate: Date,
    grouping: BucketGrouping,
    expectedCount: number,
  ): (VirtualBucket | null)[] {
    const buckets: (VirtualBucket | null)[] = [];
    const existingBucketsMap = new Map<string, VirtualBucket>();

    existingBuckets.forEach((bucket) => {
      const key = this.getBucketKey(bucket.timestamp, grouping);
      existingBucketsMap.set(key, bucket);
    });

    const oneHourMs = 60 * 60 * 1000;
    const oneDayMs = 24 * oneHourMs;
    const increment = grouping === BucketGrouping.Hour ? oneHourMs : oneDayMs;
    let currentDate = new Date(fromDate);

    if (grouping === BucketGrouping.Hour) {
      currentDate.setMinutes(0, 0, 0);
    } else {
      currentDate.setHours(0, 0, 0, 0);
    }

    for (let i = 0; i < expectedCount; i++) {
      const bucketKey = this.getBucketKey(currentDate, grouping);
      const existingBucket = existingBucketsMap.get(bucketKey);

      if (existingBucket) {
        buckets.push(existingBucket);
      } else {
        buckets.push(null);
      }

      currentDate = new Date(currentDate.getTime() + increment);
    }

    return buckets.reverse();
  }

  private getBucketKey(date: Date, grouping: BucketGrouping): string {
    if (grouping === BucketGrouping.Hour) {
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    } else {
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }
  }

  private async tryAddVirtualBucket(grouping: BucketGrouping): Promise<VirtualBucket | null> {
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

    const mostRecentBucket = mostRecentBuckets[0];

    return {
      timestamp: isDailyGrouping ? fromDateForMostRecent : mostRecentBucket.hour_timestamp,
      successCount: mostRecentBucket.success_count,
      failureCount: mostRecentBucket.failure_count,
      averageLatencyMs: mostRecentBucket.average_latency_ms,
    };
  }
}
