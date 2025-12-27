import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { LogAnalyticsBucket, LogAnalyticsQuery } from './dto/log-analytics-query.dto';
import { LogAnalyticsBucketData, LogAnalyticsResponse } from './dto/log-analytics-response.dto';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { LogAnalyticsBucketSelectionService } from './log-analytics-bucket-selection.service';
import { LogAnalyticsDateAlignmentService } from './log-analytics-date-alignment.service';
import { LogLevel } from '../core/enums/log-level.enum';

@Injectable()
export class LogAnalyticsService {
  constructor(
    private readonly clickhouse: ClickHouseClient,
    private readonly bucketSelectionService: LogAnalyticsBucketSelectionService,
    private readonly dateAlignmentService: LogAnalyticsDateAlignmentService,
  ) {}

  public async getBucketedAnalytics(
    projectId: string,
    dto: LogAnalyticsQuery,
  ): Promise<LogAnalyticsResponse> {
    const startDate = dto.startDate;
    const endDate = dto.endDate;
    const utcOffsetHours = dto.utcOffsetHours ?? 0;
    const levels = dto.levels;
    const namespaces = dto.namespaces;
    const searchString = dto.searchString;

    const bucketMinutes = this.bucketSelectionService.selectOptimalBucketSize(startDate, endDate);

    const { alignedStartDate, alignedEndDate } =
      this.dateAlignmentService.alignDatesToBucketBoundaries(
        startDate,
        endDate,
        bucketMinutes,
        utcOffsetHours,
      );

    const hasLevelsFilter = levels && levels.length > 0;
    const hasNamespacesFilter = namespaces && namespaces.length > 0;
    const hasSearchFilter = searchString && searchString.trim().length > 0;

    const levelFilterClause = hasLevelsFilter ? `AND level IN ({levels:Array(String)})` : '';
    const namespaceFilterClause = hasNamespacesFilter
      ? `AND namespace IN ({namespaces:Array(String)})`
      : '';

    let searchFilterClause = '';
    const searchWords: string[] = [];
    if (hasSearchFilter) {
      const words = searchString
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      searchWords.push(...words);
      words.forEach((_, index) => {
        searchFilterClause += ` AND positionCaseInsensitive(message, {searchWord${index}:String}) > 0`;
      });
    }

    const levelCountExpressions = hasLevelsFilter
      ? `
          countIf(level = 'info' AND level IN ({levels:Array(String)})) as info_count,
          countIf(level = 'warning' AND level IN ({levels:Array(String)})) as warning_count,
          countIf(level = 'error' AND level IN ({levels:Array(String)})) as error_count,
          countIf(level = 'http' AND level IN ({levels:Array(String)})) as http_count,
          countIf(level = 'verbose' AND level IN ({levels:Array(String)})) as verbose_count,
          countIf(level = 'debug' AND level IN ({levels:Array(String)})) as debug_count,
          countIf(level = 'silly' AND level IN ({levels:Array(String)})) as silly_count,
          countIf(level IN ({levels:Array(String)})) as total_count`
      : `
          countIf(level = 'info') as info_count,
          countIf(level = 'warning') as warning_count,
          countIf(level = 'error') as error_count,
          countIf(level = 'http') as http_count,
          countIf(level = 'verbose') as verbose_count,
          countIf(level = 'debug') as debug_count,
          countIf(level = 'silly') as silly_count,
          count() as total_count`;

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
          start_time + toIntervalMinute(bucket_minutes * toUInt64(dateDiff('minute', start_time, created_at) / bucket_minutes)) as log_bucket_start,
          ${levelCountExpressions}
        FROM logs
        WHERE 
          project_id = {projectId:String}
          AND created_at >= start_time 
          AND created_at < end_time
          ${levelFilterClause}
          ${namespaceFilterClause}
          ${searchFilterClause}
        GROUP BY log_bucket_start
      ) log_data ON buckets.bucket_start = log_data.log_bucket_start
      ORDER BY bucket_start ASC
    `;

    const queryParams: Record<string, any> = {
      projectId,
      startDate: ClickhouseUtils.jsDateToClickhouseDate(alignedStartDate),
      endDate: ClickhouseUtils.jsDateToClickhouseDate(alignedEndDate),
      bucketMinutes,
    };

    if (hasLevelsFilter) {
      queryParams.levels = levels;
    }

    if (hasNamespacesFilter) {
      queryParams.namespaces = namespaces;
    }

    if (hasSearchFilter) {
      searchWords.forEach((word, index) => {
        queryParams[`searchWord${index}`] = word;
      });
    }

    const result = await this.clickhouse.query({
      query,
      query_params: queryParams,
    });

    const data = ((await result.json()) as any).data;

    const buckets: LogAnalyticsBucketData[] = data.map((row: any) => ({
      bucketStart: ClickhouseUtils.clickhouseDateToJsDate(row.bucket_start).toISOString(),
      bucketEnd: ClickhouseUtils.clickhouseDateToJsDate(row.bucket_end).toISOString(),
      countByLevel: {
        [LogLevel.Info]: parseInt(row.info_count),
        [LogLevel.Warning]: parseInt(row.warning_count),
        [LogLevel.Error]: parseInt(row.error_count),
        [LogLevel.Http]: parseInt(row.http_count),
        [LogLevel.Verbose]: parseInt(row.verbose_count),
        [LogLevel.Debug]: parseInt(row.debug_count),
        [LogLevel.Silly]: parseInt(row.silly_count),
      },
      countTotal: parseInt(row.total_count),
    }));

    const totalLogs = buckets.reduce((sum, bucket) => sum + bucket.countTotal, 0);

    return {
      buckets,
      totalLogs,
      bucketSizeMinutes: bucketMinutes,
    };
  }
}
