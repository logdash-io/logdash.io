import { BucketGrouping } from '../../read/http-ping-bucket-read.service';

export class HttpPingBucketNormalized {
  id: string;
  httpMonitorId: string;
  timestamp: Date;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;

  public static fromExisting(
    existingBuckets: HttpPingBucketNormalized[],
    fromDate: Date,
    grouping: BucketGrouping,
    expectedCount: number,
  ): (HttpPingBucketNormalized | null)[] {
    const buckets: (HttpPingBucketNormalized | null)[] = [];
    const existingBucketsMap = new Map<string, HttpPingBucketNormalized>();

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

  private static getBucketKey(date: Date, grouping: BucketGrouping): string {
    if (grouping === BucketGrouping.Hour) {
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    } else {
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }
  }
}

export class HttpPingBucketSerialized {
  timestamp: Date;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
}
