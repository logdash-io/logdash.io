import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { HttpPingBucketNormalized } from './http-ping-bucket.interface';

export class HttpPingBucketEntity {
  id: string;

  http_monitor_id: string;

  hour_timestamp: string;

  success_count: number;

  failure_count: number;

  average_latency_ms: number;

  public static fromNormalized(normalized: HttpPingBucketNormalized): HttpPingBucketEntity {
    return {
      id: normalized.id,
      http_monitor_id: normalized.httpMonitorId,
      hour_timestamp: ClickhouseUtils.jsDateToClickhouseDate(normalized.timestamp),
      success_count: normalized.successCount,
      failure_count: normalized.failureCount,
      average_latency_ms: normalized.averageLatencyMs,
    };
  }
}
