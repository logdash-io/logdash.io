import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { HttpPingBucketEntity } from './http-ping-bucket.entity';
import { HttpPingBucketNormalized, HttpPingBucketSerialized } from './http-ping-bucket.interface';

export class HttpPingBucketSerializer {
  public static normalize(entity: HttpPingBucketEntity): HttpPingBucketNormalized {
    return {
      id: entity.id,
      httpMonitorId: entity.http_monitor_id,
      timestamp: ClickhouseUtils.clickhouseDateToJsDate(entity.hour_timestamp),
      successCount: Number(entity.success_count),
      failureCount: Number(entity.failure_count),
      averageLatencyMs: Number(entity.average_latency_ms),
    };
  }

  public static normalizeMany(entities: HttpPingBucketEntity[]): HttpPingBucketNormalized[] {
    return entities.map(this.normalize);
  }

  public static serialize(normalized: HttpPingBucketNormalized): HttpPingBucketSerialized {
    return {
      timestamp: normalized.timestamp,
      successCount: normalized.successCount,
      failureCount: normalized.failureCount,
      averageLatencyMs: normalized.averageLatencyMs,
    };
  }

  public static serializeMany(normalized: HttpPingBucketNormalized[]): HttpPingBucketSerialized[] {
    return normalized.map(this.serialize);
  }
}
