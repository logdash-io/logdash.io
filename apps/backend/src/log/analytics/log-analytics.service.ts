import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { LogAnalyticsBucket, LogAnalyticsQuery } from './dto/log-analytics-query.dto';
import { LogAnalyticsBucketData, LogAnalyticsResponse } from './dto/log-analytics-response.dto';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';

@Injectable()
export class LogAnalyticsService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async getBucketedAnalytics(
    projectId: string,
    dto: LogAnalyticsQuery,
  ): Promise<LogAnalyticsResponse> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const bucketMinutes = dto.bucket;

    const query = `
      WITH 
        {startDate:DateTime64(3)} as start_time,
        {endDate:DateTime64(3)} as end_time,
        {bucketMinutes:UInt32} as bucket_minutes,
        toUInt32((dateDiff('minute', start_time, end_time) + bucket_minutes - 1) / bucket_minutes) as total_buckets
      SELECT 
        bucket_start,
        bucket_start + toIntervalMinute(bucket_minutes) as bucket_end,
        coalesce(info_count, 0) as info_count,
        coalesce(warning_count, 0) as warning_count,
        coalesce(error_count, 0) as error_count,
        coalesce(http_count, 0) as http_count,
        coalesce(verbose_count, 0) as verbose_count,
        coalesce(debug_count, 0) as debug_count,
        coalesce(silly_count, 0) as silly_count,
        coalesce(total_count, 0) as total_count
      FROM (
        SELECT 
          start_time + toIntervalMinute(bucket_minutes * number) as bucket_start
        FROM numbers(total_buckets)
      ) buckets
      LEFT JOIN (
        SELECT 
          toStartOfInterval(created_at, toIntervalMinute(bucket_minutes)) as log_bucket_start,
          countIf(level = 'info') as info_count,
          countIf(level = 'warning') as warning_count,
          countIf(level = 'error') as error_count,
          countIf(level = 'http') as http_count,
          countIf(level = 'verbose') as verbose_count,
          countIf(level = 'debug') as debug_count,
          countIf(level = 'silly') as silly_count,
          count() as total_count
        FROM logs
        WHERE 
          project_id = {projectId:String}
          AND created_at >= start_time 
          AND created_at < end_time
        GROUP BY log_bucket_start
      ) log_data ON buckets.bucket_start = log_data.log_bucket_start
      ORDER BY bucket_start ASC
    `;

    const result = await this.clickhouse.query({
      query,
      query_params: {
        projectId,
        startDate: ClickhouseUtils.jsDateToClickhouseDate(startDate),
        endDate: ClickhouseUtils.jsDateToClickhouseDate(endDate),
        bucketMinutes,
      },
    });

    const data = ((await result.json()) as any).data;

    const buckets: LogAnalyticsBucketData[] = data.map((row: any) => ({
      bucketStart: ClickhouseUtils.clickhouseDateToJsDate(row.bucket_start).toISOString(),
      bucketEnd: ClickhouseUtils.clickhouseDateToJsDate(row.bucket_end).toISOString(),
      infoCount: parseInt(row.info_count),
      warningCount: parseInt(row.warning_count),
      errorCount: parseInt(row.error_count),
      httpCount: parseInt(row.http_count),
      verboseCount: parseInt(row.verbose_count),
      debugCount: parseInt(row.debug_count),
      sillyCount: parseInt(row.silly_count),
      totalCount: parseInt(row.total_count),
    }));

    const totalLogs = buckets.reduce((sum, bucket) => sum + bucket.totalCount, 0);

    return {
      buckets,
      totalLogs,
      bucketSizeMinutes: bucketMinutes,
    };
  }
}
