import { Injectable } from '@nestjs/common';
import { addHours, subDays, subHours } from 'date-fns';
import { HttpPingAggregationService } from 'src/http-ping/aggregation/http-ping-aggregation.service';
import { BucketGranularity } from '../core/types/bucket-granularity.enum';
import { BucketsPeriod } from '../core/types/bucket-period.enum';
import { VirtualBucket } from '../core/types/virtual-bucket.type';
import { HttpPingBucketReadService } from '../read/http-ping-bucket-read.service';

@Injectable()
export class HttpPingBucketAggregationService {
  constructor(
    private readonly httpPingAggregationService: HttpPingAggregationService,
    private readonly httpPingBucketReadService: HttpPingBucketReadService,
  ) {}

  public async getBucketsForMonitor(
    monitorId: string,
    period: BucketsPeriod,
  ): Promise<(VirtualBucket | null)[]> {
    const periodConfig = this.getPeriodConfig(period);

    const existingBuckets = await this.httpPingBucketReadService.readBucketsForMonitor(
      monitorId,
      periodConfig.fromDate,
      periodConfig.grouping,
    );

    return await this.createCompleteBuckets(
      monitorId,
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

    const nowMinusHours = (hours: number) => {
      return subHours(new Date(), hours);
    };

    const configs = {
      [BucketsPeriod.Day]: {
        fromDate: addHours(nowMinusDays(1), 1),
        grouping: BucketGranularity.Hour,
        expectedBucketCount: 24,
      },
      [BucketsPeriod.FourDays]: {
        fromDate: addHours(nowMinusDays(4), 1),
        grouping: BucketGranularity.Hour,
        expectedBucketCount: 96,
      },
      [BucketsPeriod.NinetyHours]: {
        fromDate: addHours(nowMinusHours(90), 1),
        grouping: BucketGranularity.Hour,
        expectedBucketCount: 90,
      },
      [BucketsPeriod.NinetyDays]: {
        fromDate: nowMinusDays(89),
        grouping: BucketGranularity.Day,
        expectedBucketCount: 90,
      },
    };

    return configs[period];
  }

  private async createCompleteBuckets(
    monitorId: string,
    existingBuckets: VirtualBucket[],
    fromDate: Date,
    grouping: BucketGranularity,
    expectedBucketCount: number,
  ): Promise<(VirtualBucket | null)[]> {
    const completeBuckets = this.fillWithEmptyBuckets(
      existingBuckets,
      fromDate,
      grouping,
      expectedBucketCount,
    );

    const nowVirtualBucket = await this.tryCreateVirtualBucket(monitorId, grouping);
    if (nowVirtualBucket) {
      completeBuckets[0] = completeBuckets[0]
        ? VirtualBucket.fromMany([completeBuckets[0], nowVirtualBucket])
        : nowVirtualBucket;
    }

    return completeBuckets;
  }

  private fillWithEmptyBuckets(
    existingBuckets: VirtualBucket[],
    fromDate: Date,
    grouping: BucketGranularity,
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
    const increment = grouping === BucketGranularity.Hour ? oneHourMs : oneDayMs;
    let currentDate = new Date(fromDate);

    if (grouping === BucketGranularity.Hour) {
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

  private getBucketKey(date: Date, grouping: BucketGranularity): string {
    if (grouping === BucketGranularity.Hour) {
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    } else {
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }
  }

  private async tryCreateVirtualBucket(
    monitorId: string,
    grouping: BucketGranularity,
  ): Promise<VirtualBucket | null> {
    const toDate = addHours(new Date(), 1);
    toDate.setMinutes(0, 0);
    const fromDateForMostRecent = subHours(toDate, 1);
    const isDailyGrouping = grouping === BucketGranularity.Day;

    if (isDailyGrouping) {
      fromDateForMostRecent.setUTCHours(0, 0, 0, 0);
    }

    const mostRecentBuckets = await this.httpPingAggregationService.aggregateByMonitorForTimeRange(
      monitorId,
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
