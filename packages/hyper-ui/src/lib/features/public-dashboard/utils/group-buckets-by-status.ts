export interface Bucket {
  timestamp: string;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number | null;
}

export type BucketStatus = "up" | "degraded" | "down" | "unknown";

type BucketCounts = Pick<Bucket, "successCount" | "failureCount">;

export function getUptimeFromBucket(bucket: BucketCounts | null): number | null {
  const total = bucket ? bucket.successCount + bucket.failureCount : 0;
  if (!bucket || total === 0) return null;
  return (bucket.successCount / total) * 100;
}

export function getBucketStatus(bucket: BucketCounts | null): BucketStatus {
  const uptime = getUptimeFromBucket(bucket);
  if (uptime === null) return "unknown";
  if (uptime >= 99.9) return "up";
  if (uptime >= 50) return "degraded";
  return "down";
}
