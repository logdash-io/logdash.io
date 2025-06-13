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
}
