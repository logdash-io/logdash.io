export class CreateHttpPingBucketDto {
  httpMonitorId: string;
  timestamp: Date;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
}
