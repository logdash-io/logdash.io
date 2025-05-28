import { type ClickHouseClient } from '@clickhouse/client';
import { Inject, Injectable } from '@nestjs/common';
import { CLICKHOUSE_CLIENT } from 'src/shared/clickhouse/clickhouse.module';
import { HttpPingEntity } from '../core/entities/http-ping.entity';
import { HttpPingNormalized } from '../core/entities/http-ping.interface';

@Injectable()
export class HttpPingReadChService {
  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  public async readByMonitorId(monitorId: string): Promise<HttpPingNormalized[]> {
    const result = await this.clickhouse.query({
      query: `
        SELECT * FROM httpPings 
        WHERE httpMonitorId = {monitorId:String} 
        ORDER BY createdAt DESC
      `,
      query_params: { monitorId },
      format: 'JSONEachRow',
    });

    const entities = await result.json<HttpPingEntity[]>();
    return entities.map((entity) => this.normalizeHttpPing(entity));
  }

  private normalizeHttpPing(entity: HttpPingEntity): HttpPingNormalized {
    return {
      id: entity._id.toString(),
      httpMonitorId: entity.httpMonitorId,
      statusCode: entity.statusCode,
      responseTimeMs: entity.responseTimeMs,
      message: entity.message,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
