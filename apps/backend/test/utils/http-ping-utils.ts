import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpPingEntity } from '../../src/http-ping/core/entities/http-ping.entity';
import { HttpPingNormalized } from '../../src/http-ping/core/entities/http-ping.interface';
import { HttpPingSerializer } from '../../src/http-ping/core/entities/http-ping.serializer';
import { ClickHouseClient } from '@clickhouse/client';

export class HttpPingUtils {
  private clickhouseClient: ClickHouseClient;

  constructor(private readonly app: INestApplication<any>) {
    this.clickhouseClient = app.get(ClickHouseClient);
  }

  public async createHttpPing(params: {
    httpMonitorId: string;
    statusCode?: number;
    responseTimeMs?: number;
    message?: string;
  }): Promise<HttpPingNormalized> {
    const httpPingEntity = HttpPingEntity.fromNormalized({
      id: new Types.ObjectId().toString(),
      createdAt: new Date(),
      httpMonitorId: params.httpMonitorId,
      message: params.message || 'Default HTTP ping',
      responseTimeMs: params.responseTimeMs || 100,
      statusCode: params.statusCode || 200,
    });

    await this.clickhouseClient.insert({
      table: 'http_pings',
      values: [httpPingEntity],
      format: 'JSONEachRow',
    });

    return HttpPingSerializer.normalize(httpPingEntity);
  }

  public async getMonitorPings(params: { httpMonitorId: string }): Promise<HttpPingNormalized[]> {
    const response = await this.clickhouseClient.query({
      query: `SELECT * FROM http_pings WHERE http_monitor_id = {httpMonitorId:FixedString(24)}`,
      query_params: {
        httpMonitorId: params.httpMonitorId,
      },
      format: 'JSONEachRow',
    });
    return HttpPingSerializer.normalizeMany((await response.json()) as any as HttpPingEntity[]);
  }

  public async getAllPings(): Promise<HttpPingNormalized[]> {
    const response = await this.clickhouseClient.query({
      query: `SELECT * FROM http_pings`,
      format: 'JSONEachRow',
    });

    return HttpPingSerializer.normalizeMany((await response.json()) as any as HttpPingEntity[]);
  }
}
