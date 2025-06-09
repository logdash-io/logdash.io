import { ClickHouseClient } from '@clickhouse/client';
import { INestApplication } from '@nestjs/common';
import { Types } from 'mongoose';
import { HttpPingBucketEntity } from '../../src/http-ping-bucket/core/entities/http-ping-bucket.entity';
import { HttpPingBucketNormalized } from '../../src/http-ping-bucket/core/entities/http-ping-bucket.interface';
import { HttpPingBucketSerializer } from '../../src/http-ping-bucket/core/entities/http-ping-bucket.serializer';

export class HttpPingBucketUtils {
  private clickhouseClient: ClickHouseClient;

  constructor(private readonly app: INestApplication<any>) {
    this.clickhouseClient = app.get(ClickHouseClient);
  }

  public async createHttpPingBucket(params: {
    httpMonitorId: string;
    timestamp?: Date;
    successCount?: number;
    failureCount?: number;
    averageLatencyMs?: number;
  }): Promise<HttpPingBucketNormalized> {
    const bucketEntity = HttpPingBucketEntity.fromNormalized({
      id: new Types.ObjectId().toString(),
      httpMonitorId: params.httpMonitorId,
      timestamp: params.timestamp || new Date(),
      successCount: params.successCount || 10,
      failureCount: params.failureCount || 2,
      averageLatencyMs: params.averageLatencyMs || 150.5,
    });

    await this.clickhouseClient.insert({
      table: 'http_ping_buckets',
      values: [bucketEntity],
      format: 'JSONEachRow',
    });

    return HttpPingBucketSerializer.normalize(bucketEntity);
  }

  public async getMonitorBuckets(params: {
    httpMonitorId: string;
  }): Promise<HttpPingBucketNormalized[]> {
    const response = await this.clickhouseClient.query({
      query: `SELECT * FROM http_ping_buckets WHERE http_monitor_id = {httpMonitorId:FixedString(24)}`,
      query_params: {
        httpMonitorId: params.httpMonitorId,
      },
      format: 'JSONEachRow',
    });
    return HttpPingBucketSerializer.normalizeMany(
      (await response.json()) as any as HttpPingBucketEntity[],
    );
  }

  public async getAllBuckets(): Promise<HttpPingBucketNormalized[]> {
    const response = await this.clickhouseClient.query({
      query: `SELECT * FROM http_ping_buckets`,
      format: 'JSONEachRow',
    });

    return HttpPingBucketSerializer.normalizeMany(
      (await response.json()) as any as HttpPingBucketEntity[],
    );
  }
}
