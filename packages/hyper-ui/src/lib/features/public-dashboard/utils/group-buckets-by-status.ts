export interface Bucket {
  timestamp: string;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
}

export type BucketStatus = "up" | "degraded" | "down" | "unknown";

export interface BucketSegment {
  status: BucketStatus;
  buckets: (Bucket | null)[];
  bucketCount: number;
  startTime: Date | null;
  endTime: Date | null;
  avgUptime: number;
  totalSuccess: number;
  totalFailure: number;
}

function getUptimeFromBucket(bucket: Bucket | null): number {
  if (!bucket) return 100;
  const total = bucket.successCount + bucket.failureCount;
  if (total === 0) return 100;
  return (bucket.successCount / total) * 100;
}

function getBucketStatus(bucket: Bucket | null): BucketStatus {
  if (!bucket) return "unknown";
  const uptime = getUptimeFromBucket(bucket);
  if (uptime >= 99.99) return "up";
  if (uptime >= 50) return "degraded";
  return "down";
}

export const groupBucketsByStatus = (
  buckets: (Bucket | null)[]
): BucketSegment[] => {
  if (!buckets.length) return [];

  const segments: BucketSegment[] = [];
  let currentSegment: BucketSegment | null = null;

  for (const bucket of buckets) {
    const bucketStatus = getBucketStatus(bucket);
    const bucketDate = bucket ? new Date(bucket.timestamp) : null;

    if (!currentSegment || currentSegment.status !== bucketStatus) {
      if (currentSegment) {
        segments.push(currentSegment);
      }

      currentSegment = {
        status: bucketStatus,
        buckets: [bucket],
        bucketCount: 1,
        startTime: bucketDate,
        endTime: bucketDate,
        avgUptime: getUptimeFromBucket(bucket),
        totalSuccess: bucket?.successCount ?? 0,
        totalFailure: bucket?.failureCount ?? 0,
      };
    } else {
      currentSegment.buckets.push(bucket);
      currentSegment.bucketCount++;
      if (bucketDate) {
        currentSegment.endTime = bucketDate;
      }
      currentSegment.totalSuccess += bucket?.successCount ?? 0;
      currentSegment.totalFailure += bucket?.failureCount ?? 0;

      const total = currentSegment.totalSuccess + currentSegment.totalFailure;
      currentSegment.avgUptime =
        total > 0 ? (currentSegment.totalSuccess / total) * 100 : 100;
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
};

export const formatBucketTimeRange = (
  start: Date | null,
  end: Date | null
): string => {
  if (!start && !end) return "No data";

  const formatDate = (date: Date) => {
    const month = date.toLocaleString("en", { month: "short" });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  if (!start || !end || start.getTime() === end.getTime()) {
    return formatDate(start || end!);
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
};
