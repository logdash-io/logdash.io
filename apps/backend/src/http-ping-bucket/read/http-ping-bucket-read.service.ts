import { ClickHouseClient } from '@clickhouse/client';
import { Injectable } from '@nestjs/common';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { VirtualBucket } from '../aggregation/types/virtual-bucket.type';

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
  ): Promise<VirtualBucket[]> {
    const toDate = new Date();
    let query: string;

    if (grouping === BucketGrouping.Hour) {
      query = `
        SELECT 
          hour_timestamp as timestamp,
          success_count as successCount,
          failure_count as failureCount,
          average_latency_ms as averageLatencyMs
        FROM http_ping_buckets 
        WHERE http_monitor_id = {monitorId:FixedString(24)}
          AND timestamp >= {fromDate:DateTime64(3)}
          AND timestamp <= {toDate:DateTime64(3)}
        ORDER BY timestamp ASC
      `;
    } else {
      query = `
        SELECT 
          toStartOfDay(hour_timestamp) AS timestamp,
          sum(success_count) AS successCount,
          sum(failure_count) AS failureCount,
          avg(average_latency_ms) AS averageLatencyMs
        FROM http_ping_buckets 
        WHERE http_monitor_id = {monitorId:FixedString(24)}
          AND hour_timestamp >= {fromDate:DateTime64(3)}
          AND hour_timestamp <= {toDate:DateTime64(3)}
        GROUP BY timestamp
        ORDER BY timestamp ASC
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

    const resultData = ((await result.json()) as any).data;

    return resultData.map((rawBucket) => ({
      timestamp: ClickhouseUtils.clickhouseDateToJsDate(rawBucket.timestamp),
      averageLatencyMs: Number(rawBucket.averageLatencyMs),
      failureCount: Number(rawBucket.failureCount),
      successCount: Number(rawBucket.successCount),
    }));
  }
}
