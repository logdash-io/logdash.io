import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { HttpPingNormalized } from './http-ping.interface';

export class HttpPingEntity {
  id: string;

  http_monitor_id: string;

  status_code: number;

  response_time_ms: number;

  message: string | null;

  created_at: string;

  public static fromNormalized(normalized: HttpPingNormalized): HttpPingEntity {
    return {
      id: normalized.id,
      http_monitor_id: normalized.httpMonitorId,
      status_code: normalized.statusCode,
      response_time_ms: normalized.responseTimeMs,
      message: normalized.message || null,
      created_at: ClickhouseUtils.jsDateToClickhouseDate(normalized.createdAt),
    };
  }
}
