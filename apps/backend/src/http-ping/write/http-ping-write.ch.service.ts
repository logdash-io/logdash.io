import { type ClickHouseClient } from '@clickhouse/client';
import { Inject, Injectable } from '@nestjs/common';
import { CLICKHOUSE_CLIENT } from 'src/shared/clickhouse/clickhouse.module';
import { HttpPingEntity } from '../core/entities/http-ping.entity';
import { HttpPingNormalized } from '../core/entities/http-ping.interface';
import { CreateHttpPingDto } from './dto/create-http-ping.dto';

@Injectable()
export class HttpPingWriteChService {
  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  public async createMany(dtos: CreateHttpPingDto[]): Promise<HttpPingNormalized[]> {
    if (dtos.length === 0) return [];

    const now = new Date();
    const httpPingData = dtos.map((dto) => ({
      _id: this.generateId(),
      httpMonitorId: dto.httpMonitorId,
      statusCode: dto.statusCode,
      responseTimeMs: dto.responseTimeMs,
      message: dto.message || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }));

    await this.clickhouse.insert({
      table: 'httpPings',
      values: httpPingData,
      format: 'JSONEachRow',
    });

    return httpPingData.map((data) =>
      this.normalizeHttpPing({
        _id: data._id as any,
        httpMonitorId: data.httpMonitorId,
        statusCode: data.statusCode,
        responseTimeMs: data.responseTimeMs,
        message: data.message,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      }),
    );
  }

  public async deleteOlderThan(date: Date): Promise<void> {
    await this.clickhouse.command({
      query: `DELETE FROM httpPings WHERE createdAt < {date:DateTime}`,
      query_params: { date: date.toISOString() },
    });
  }

  public async deleteByMonitorIds(monitorIds: string[]): Promise<void> {
    if (monitorIds.length === 0) return;

    await this.clickhouse.command({
      query: `DELETE FROM httpPings WHERE httpMonitorId IN ({monitorIds:Array(String)})`,
      query_params: { monitorIds },
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
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
