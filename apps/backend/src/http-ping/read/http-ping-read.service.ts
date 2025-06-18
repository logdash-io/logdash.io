import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { HttpPingNormalized } from '../core/entities/http-ping.interface';
import { HttpPingSerializer } from '../core/entities/http-ping.serializer';
import { HttpPingEntity } from '../core/entities/http-ping.entity';

@Injectable()
export class HttpPingReadService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async readByMonitorId(
    monitorId: string,
    limit: number = 100,
  ): Promise<HttpPingNormalized[]> {
    const result = await this.clickhouse.query({
      query: `
        SELECT 
          id,
          http_monitor_id,
          created_at,
          status_code,
          response_time_ms,
          message
        FROM http_pings 
        WHERE http_monitor_id = {monitorId:FixedString(24)}
        ORDER BY created_at DESC
        LIMIT {limit:UInt64}
      `,
      query_params: {
        monitorId,
        limit,
      },
    });

    const data = ((await result.json()) as any).data as HttpPingEntity[];

    return HttpPingSerializer.normalizeMany(data);
  }

  public async readManyByMonitorIds(
    monitorIds: string[],
    limitPerMonitor: number = 100,
  ): Promise<Record<string, HttpPingNormalized[]>> {
    const result = await this.clickhouse.query({
      query: `
        WITH
          (
            SELECT groupArray(http_monitor_id)
            FROM (
              SELECT DISTINCT http_monitor_id
              FROM http_pings
              WHERE http_monitor_id IN ({monitorIds:Array(FixedString(24))})
            )
          ) AS monitor_ids
        SELECT 
          id,
          http_monitor_id,
          created_at,
          status_code,
          response_time_ms,
          message
        FROM (
          SELECT
            *,
            row_number() OVER (PARTITION BY http_monitor_id ORDER BY created_at DESC) as rn
          FROM http_pings
          WHERE http_monitor_id IN ({monitorIds:Array(FixedString(24))})
        )
        WHERE rn <= {limitPerMonitor:UInt64}
      `,
      query_params: {
        monitorIds,
        limitPerMonitor,
      },
    });

    const data = ((await result.json()) as any).data as HttpPingEntity[];

    return data.reduce(
      (acc, ping) => {
        acc[ping.http_monitor_id] = [
          ...(acc[ping.http_monitor_id] || []),
          HttpPingSerializer.normalize(ping as HttpPingEntity),
        ];
        return acc;
      },
      {} as Record<string, HttpPingNormalized[]>,
    );
  }
}
