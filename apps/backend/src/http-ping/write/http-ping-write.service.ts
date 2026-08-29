import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { CreateHttpPingDto } from './dto/create-http-ping.dto';
import { Types } from 'mongoose';
import { HttpPingEntity } from '../core/entities/http-ping.entity';
import { HttpPingNormalized } from '../core/entities/http-ping.interface';
import { HttpPingSerializer } from '../core/entities/http-ping.serializer';

@Injectable()
export class HttpPingWriteService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async createMany(dtos: CreateHttpPingDto[]): Promise<HttpPingNormalized[]> {
    if (dtos.length === 0) return [];

    const httpPings = dtos.map((dto) =>
      HttpPingEntity.fromNormalized({
        id: new Types.ObjectId().toString(),
        createdAt: new Date(),
        httpMonitorId: dto.httpMonitorId,
        message: dto.message,
        responseTimeMs: dto.responseTimeMs,
        statusCode: dto.statusCode,
      }),
    );

    await this.clickhouse.insert({
      table: 'http_pings',
      values: httpPings,
      format: 'JSONEachRow',
    });

    return HttpPingSerializer.normalizeMany(httpPings);
  }

  public async deleteOlderThan(date: Date): Promise<void> {
    await this.clickhouse.command({
      query: `DELETE FROM http_pings WHERE created_at < {date:DateTime64(3)}`,
      query_params: { date: ClickhouseUtils.jsDateToClickhouseDate(date) },
    });
  }

  public async deleteByMonitorIds(monitorIds: string[]): Promise<void> {
    if (monitorIds.length === 0) return;

    await this.clickhouse.command({
      query: `DELETE FROM http_pings WHERE http_monitor_id IN ({monitorIds:Array(FixedString(24))})`,
      query_params: { monitorIds },
    });
  }
}
