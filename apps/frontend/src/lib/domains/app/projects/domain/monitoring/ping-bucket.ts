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
