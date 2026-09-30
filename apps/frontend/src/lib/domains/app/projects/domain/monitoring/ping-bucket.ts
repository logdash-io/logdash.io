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

export function fillEmptySlots(
  buckets: (PingBucket | null)[],
  unit: BucketUnit,
): Bucket[] {
  const anchor = buckets.findIndex((bucket) => bucket !== null);
  const known = buckets[anchor];

  if (!known) {
    return [];
  }

  const anchorMs = Date.parse(known.timestamp);

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
