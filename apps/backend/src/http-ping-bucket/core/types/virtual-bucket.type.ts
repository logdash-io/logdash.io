export class VirtualBucket {
  timestamp: Date;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;

  public static fromMany(buckets: VirtualBucket[]): VirtualBucket {
    if (buckets.length === 0) {
      throw new Error('Cannot aggregate empty buckets');
    }

    const pingsCount = buckets.reduce(
      (acc, bucket) => acc + bucket.successCount + bucket.failureCount,
      0,
    );

    const latencySum = buckets.reduce(
      (acc, bucket) => acc + (bucket.successCount + bucket.failureCount) * bucket.averageLatencyMs,
      0,
    );

    return {
      timestamp: buckets[0].timestamp,
      successCount: buckets.reduce((acc, bucket) => acc + bucket.successCount, 0),
      failureCount: buckets.reduce((acc, bucket) => acc + bucket.failureCount, 0),
      averageLatencyMs: Math.round(latencySum / pingsCount),
    };
  }
}
