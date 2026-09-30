import { Injectable } from '@nestjs/common';
import { addHours } from 'date-fns';
import { HttpPingAggregationService } from 'src/http-ping/aggregation/http-ping-aggregation.service';
import { BucketGranularity } from '../core/types/bucket-granularity.enum';
import { BucketsPeriod } from '../core/types/bucket-period.enum';
import { VirtualBucket } from '../core/types/virtual-bucket.type';
import { HttpPingBucketReadService } from '../read/http-ping-bucket-read.service';

// Buckets are UTC hours and UTC days whatever the time zone of the host.
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const startOfUtcHour = (date: Date): Date =>
  new Date(Math.floor(date.getTime() / HOUR_MS) * HOUR_MS);
const startOfUtcDay = (date: Date): Date => new Date(Math.floor(date.getTime() / DAY_MS) * DAY_MS);

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
    // Plain milliseconds: date-fns subDays keeps the local wall time, so it is 23 or 25 hours
    // across a daylight saving change of the host.
    const nowMinusDays = (days: number) => new Date(Date.now() - days * DAY_MS);
    const nowMinusHours = (hours: number) => new Date(Date.now() - hours * HOUR_MS);

    const configs = {
      [BucketsPeriod.Day]: {
        fromDate: startOfUtcHour(addHours(nowMinusDays(1), 1)),
        grouping: BucketGranularity.Hour,
        expectedBucketCount: 24,
      },
      [BucketsPeriod.FourDays]: {
        fromDate: startOfUtcHour(addHours(nowMinusDays(4), 1)),
        grouping: BucketGranularity.Hour,
        expectedBucketCount: 96,
      },
      [BucketsPeriod.NinetyHours]: {
        fromDate: startOfUtcHour(addHours(nowMinusHours(90), 1)),
        grouping: BucketGranularity.Hour,
        expectedBucketCount: 90,
      },
      [BucketsPeriod.NinetyDays]: {
        fromDate: startOfUtcDay(nowMinusDays(89)),
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

    const isHourly = grouping === BucketGranularity.Hour;
    const increment = isHourly ? HOUR_MS : DAY_MS;
    let currentDate = isHourly ? startOfUtcHour(fromDate) : startOfUtcDay(fromDate);

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
    // "2025-05-10T12" for hours, "2025-05-10" for days
    return date.toISOString().slice(0, grouping === BucketGranularity.Hour ? 13 : 10);
  }

  private async tryCreateVirtualBucket(
    monitorId: string,
    grouping: BucketGranularity,
  ): Promise<VirtualBucket | null> {
    const currentHour = startOfUtcHour(new Date());
    const [mostRecentBucket] = await this.httpPingAggregationService.aggregateByMonitorForTimeRange(
      monitorId,
      currentHour,
      addHours(currentHour, 1),
    );

    if (!mostRecentBucket) {
      return null;
    }

    return {
      timestamp:
        grouping === BucketGranularity.Day
          ? startOfUtcDay(currentHour)
          : mostRecentBucket.hour_timestamp,
      successCount: mostRecentBucket.success_count,
      failureCount: mostRecentBucket.failure_count,
      averageLatencyMs: mostRecentBucket.average_latency_ms,
    };
  }
}
