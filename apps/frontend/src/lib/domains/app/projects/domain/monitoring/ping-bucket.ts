import type { Bucket } from '@logdash/status';

export interface PingBucket {
  timestamp: string;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
}

export interface PingBucketsResponse {
  buckets: (PingBucket | null)[];
  granularity: string;
}

export type PingBucketPeriod = '24h' | '4d' | '90h' | '90d';

export type BucketUnit = 'hour' | 'day';

const UNIT_MS: Record<BucketUnit, number> = {
  hour: 3_600_000,
  day: 86_400_000,
};

export function bucketUptime(buckets: (PingBucket | null)[]): number | null {
  let success = 0;
  let total = 0;

  for (const bucket of buckets) {
    if (!bucket) {
      continue;
    }

    success += bucket.successCount;
    total += bucket.successCount + bucket.failureCount;
  }

  return total ? (success / total) * 100 : null;
}

export function fillEmptySlots(
  buckets: (PingBucket | null)[],
  unit: BucketUnit,
  now: number = Date.now(),
): Bucket[] {
  const known = buckets.findIndex((bucket) => bucket !== null);
  const anchor = known === -1 ? buckets.length - 1 : known;
  const anchorMs =
    known === -1
      ? Math.floor(now / UNIT_MS[unit]) * UNIT_MS[unit]
      : Date.parse(buckets[known]!.timestamp);

  return buckets.map(
    (bucket, index) =>
      bucket ?? {
        timestamp: new Date(
          anchorMs + (index - anchor) * UNIT_MS[unit],
        ).toISOString(),
        successCount: 0,
        failureCount: 0,
        averageLatencyMs: null,
      },
  );
}
