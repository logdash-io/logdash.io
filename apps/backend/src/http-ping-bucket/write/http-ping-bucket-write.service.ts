import { ClickHouseClient } from '@clickhouse/client';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { HttpPingBucketEntity } from '../core/entities/http-ping-bucket.entity';
import { HttpPingBucketNormalized } from '../core/entities/http-ping-bucket.interface';
import { HttpPingBucketSerializer } from '../core/entities/http-ping-bucket.serializer';
import { CreateHttpPingBucketDto } from './dto/create-http-ping-bucket.dto';

@Injectable()
export class HttpPingBucketWriteService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async createMany(dtos: CreateHttpPingBucketDto[]): Promise<HttpPingBucketNormalized[]> {
    if (dtos.length === 0) return [];

    const buckets = dtos.map((dto) =>
      HttpPingBucketEntity.fromNormalized({
        id: new Types.ObjectId().toString(),
        httpMonitorId: dto.httpMonitorId,
        timestamp: dto.timestamp,
        successCount: dto.successCount,
        failureCount: dto.failureCount,
        averageLatencyMs: dto.averageLatencyMs,
      }),
    );

    await this.clickhouse.insert({
      table: 'http_ping_buckets',
      values: buckets,
      format: 'JSONEachRow',
    });

    return HttpPingBucketSerializer.normalizeMany(buckets);
  }

  public async deleteOlderThan(date: Date): Promise<void> {
    await this.clickhouse.command({
      query: `DELETE FROM http_ping_buckets WHERE hour_timestamp < '${ClickhouseUtils.jsDateToClickhouseDate(date)}'`,
    });
  }

  public async deleteByMonitorIds(monitorIds: string[]): Promise<void> {
    if (monitorIds.length === 0) return;

    const monitorIdsStr = monitorIds.map((id) => `'${id}'`).join(',');
    await this.clickhouse.command({
      query: `DELETE FROM http_ping_buckets WHERE http_monitor_id IN (${monitorIdsStr})`,
    });
  }
}
