import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { LogAnalyticsQuery } from '../../analytics/dto/log-analytics-query.dto';
import { ReadLogsQuery } from './read-newer-than.query';

export class AppsFilterQuery {
  @ApiPropertyOptional({
    isArray: true,
    description: 'Only logs from these apps. Leave it out for every app on the domain.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }): unknown[] =>
    Array.isArray(value) ? value : [value].filter(Boolean),
  )
  apps?: string[];
}

export class ReadClusterLogsQuery extends IntersectionType(ReadLogsQuery, AppsFilterQuery) {}

export class ClusterLogAnalyticsQuery extends IntersectionType(
  LogAnalyticsQuery,
  AppsFilterQuery,
) {}
