import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { HttpPingEntity } from './http-ping.entity';
import { HttpPingNormalized, HttpPingSerialized } from './http-ping.interface';

export class HttpPingSerializer {
  public static normalize(entity: HttpPingEntity): HttpPingNormalized {
    return {
      id: entity.id,
      httpMonitorId: entity.http_monitor_id,
      statusCode: entity.status_code,
      responseTimeMs: entity.response_time_ms,
      message: entity.message || undefined,
      createdAt: ClickhouseUtils.clickhouseDateToJsDate(entity.created_at),
    };
  }

  public static normalizeMany(entities: HttpPingEntity[]): HttpPingNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(normalized: HttpPingNormalized): HttpPingSerialized {
    return {
      id: normalized.id,
      httpMonitorId: normalized.httpMonitorId,
      statusCode: normalized.statusCode,
      responseTimeMs: normalized.responseTimeMs,
      message: normalized.message,
      createdAt: normalized.createdAt,
    };
  }

  public static serializeMany(normalized: HttpPingNormalized[]): HttpPingSerialized[] {
    return normalized.map((entity) => this.serialize(entity));
  }
}
