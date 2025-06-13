import { ClickHouseClient } from '@clickhouse/client';
import { Injectable } from '@nestjs/common';
import { ClickhouseUtils } from 'src/clickhouse/clickhouse.utils';

export interface PingsAggregation {
  http_monitor_id: string;
  hour_timestamp: Date;
  success_count: number;
  failure_count: number;
  average_latency_ms: number;
}

@Injectable()
export class HttpPingAggregationService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async aggregateByMonitorForTimeRange(
    monitorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<PingsAggregation[]> {
    const aggregationResult = await this.clickhouse.query({
      query: `
        SELECT 
          http_monitor_id,
          toStartOfHour(created_at) as hour_timestamp,
          countIf(status_code >= 200 AND status_code < 400) as success_count,
          countIf(status_code >= 400 OR status_code = 0) as failure_count,
          avg(response_time_ms) as average_latency_ms
        FROM http_pings 
        WHERE http_monitor_id = {monitorId:String}
          AND created_at >= {startTime:DateTime64(3)}
          AND created_at < {endTime:DateTime64(3)}
        GROUP BY http_monitor_id, toStartOfHour(created_at)
        HAVING success_count + failure_count > 0
      `,
      query_params: {
        monitorId,
        startTime: ClickhouseUtils.jsDateToClickhouseDate(startTime),
        endTime: ClickhouseUtils.jsDateToClickhouseDate(endTime),
      },
    });

    const resultData = ((await aggregationResult.json()) as any).data;

    return resultData.map((rawBucket) => ({
      http_monitor_id: rawBucket.http_monitor_id,
      hour_timestamp: ClickhouseUtils.clickhouseDateToJsDate(rawBucket.hour_timestamp),
      success_count: Number(rawBucket.success_count),
      failure_count: Number(rawBucket.failure_count),
      average_latency_ms: Number(rawBucket.average_latency_ms),
    }));
  }

  public async aggregateAllForTimeRange(
    startTime: Date,
    endTime: Date,
  ): Promise<PingsAggregation[]> {
    const aggregationResult = await this.clickhouse.query({
      query: `
        SELECT 
          http_monitor_id,
          toStartOfHour(created_at) as hour_timestamp,
          countIf(status_code >= 200 AND status_code < 400) as success_count,
          countIf(status_code >= 400 OR status_code = 0) as failure_count,
          avg(response_time_ms) as average_latency_ms
        FROM http_pings 
        WHERE created_at >= {startTime:DateTime64(3)}
          AND created_at < {endTime:DateTime64(3)}
        GROUP BY http_monitor_id, toStartOfHour(created_at)
        HAVING success_count + failure_count > 0
      `,
      query_params: {
        startTime: ClickhouseUtils.jsDateToClickhouseDate(startTime),
        endTime: ClickhouseUtils.jsDateToClickhouseDate(endTime),
      },
    });

    const resultData = ((await aggregationResult.json()) as any).data;

    return resultData.map((rawBucket) => ({
      http_monitor_id: rawBucket.http_monitor_id,
      hour_timestamp: ClickhouseUtils.clickhouseDateToJsDate(rawBucket.hour_timestamp),
      success_count: Number(rawBucket.success_count),
      failure_count: Number(rawBucket.failure_count),
      average_latency_ms: Number(rawBucket.average_latency_ms),
    }));
  }
}
