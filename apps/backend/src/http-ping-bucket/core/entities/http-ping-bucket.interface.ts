export class HttpPingBucketNormalized {
  id: string;
  httpMonitorId: string;
  timestamp: Date;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
}

export class HttpPingBucketSerialized {
  timestamp: Date;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
}
