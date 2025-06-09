import { ClickHouseClient } from '@clickhouse/client';
import { Injectable } from '@nestjs/common';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { HttpPingBucketEntity } from '../core/entities/http-ping-bucket.entity';
import { HttpPingBucketNormalized } from '../core/entities/http-ping-bucket.interface';
import { HttpPingBucketSerializer } from '../core/entities/http-ping-bucket.serializer';

export enum BucketGrouping {
  Hour = 'hour',
  Day = 'day',
}

@Injectable()
export class HttpPingBucketReadService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async readBucketsForMonitor(
    monitorId: string,
    fromDate: Date,
    grouping: BucketGrouping = BucketGrouping.Hour,
  ): Promise<HttpPingBucketNormalized[]> {
    const toDate = new Date();
    let query: string;

    if (grouping === BucketGrouping.Hour) {
      query = `
        SELECT 
          id,
          http_monitor_id,
          hour_timestamp,
          success_count,
          failure_count,
          average_latency_ms
        FROM http_ping_buckets 
        WHERE http_monitor_id = {monitorId:FixedString(24)}
          AND hour_timestamp >= {fromDate:DateTime64(3)}
          AND hour_timestamp <= {toDate:DateTime64(3)}
        ORDER BY hour_timestamp ASC
      `;
    } else {
      query = `
        SELECT 
          toString(generateUUIDv4()) AS id,
          {monitorId:FixedString(24)} AS http_monitor_id,
          toStartOfDay(hour_timestamp) AS hour_timestamp,
          sum(success_count) AS success_count,
          sum(failure_count) AS failure_count,
          avg(average_latency_ms) AS average_latency_ms
        FROM http_ping_buckets 
        WHERE http_monitor_id = {monitorId:FixedString(24)}
          AND hour_timestamp >= {fromDate:DateTime64(3)}
          AND hour_timestamp <= {toDate:DateTime64(3)}
        GROUP BY hour_timestamp
        ORDER BY hour_timestamp ASC
      `;
    }
    const result = await this.clickhouse.query({
      query,
      query_params: {
        monitorId,
        fromDate: ClickhouseUtils.jsDateToClickhouseDate(fromDate),
        toDate: ClickhouseUtils.jsDateToClickhouseDate(toDate),
      },
    });

    const data = ((await result.json()) as any).data as HttpPingBucketEntity[];

    return HttpPingBucketSerializer.normalizeMany(data);
  }
}
