import { IntersectionType, PickType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LogLevel } from '../../../log/core/enums/log-level.enum';
import {
  ReadWebAnalyticsFilterQuery,
  ReadWebAnalyticsSchemaQuery,
  ReadWebAnalyticsTimeZoneQuery,
  WEB_ANALYTICS_BREAKDOWNS,
  WebAnalyticsBreakdownName,
} from '../../../web-analytics/core/dto/read-web-analytics.query';
import {
  ReorderWebAnalyticsInsightsBody,
  WebAnalyticsChartBody,
  WebAnalyticsInsightBody,
} from '../../../web-analytics/core/dto/web-analytics-insight.body';
import { UpdateWebAnalyticsViewsBody } from '../../../web-analytics/core/dto/web-analytics-views.body';

export class McpClusterArgs {
  @IsMongoId()
  clusterId: string;
}

export class McpDescribeArgs extends ReadWebAnalyticsSchemaQuery {
  @IsOptional()
  @IsMongoId()
  clusterId?: string;
}

export class McpInsightIdArgs extends McpClusterArgs {
  @IsMongoId()
  insightId: string;
}

export class McpRunInsightArgs extends IntersectionType(
  McpInsightIdArgs,
  ReadWebAnalyticsTimeZoneQuery,
) {}

export class McpReorderInsightsArgs extends IntersectionType(
  McpClusterArgs,
  ReorderWebAnalyticsInsightsBody,
) {}

export class McpSetViewsArgs extends IntersectionType(
  McpClusterArgs,
  UpdateWebAnalyticsViewsBody,
) {}

export class McpRangeArgs extends IntersectionType(
  McpClusterArgs,
  ReadWebAnalyticsFilterQuery,
  ReadWebAnalyticsSchemaQuery,
) {}

export class McpRetentionArgs extends IntersectionType(
  McpClusterArgs,
  ReadWebAnalyticsTimeZoneQuery,
  ReadWebAnalyticsSchemaQuery,
) {}

export class McpBreakdownArgs extends McpRangeArgs {
  @IsIn(WEB_ANALYTICS_BREAKDOWNS)
  dimension: WebAnalyticsBreakdownName;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}

export class McpPersonFunnelArgs extends McpRangeArgs {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(1100, { each: true })
  @Matches(/^(page|goal):.+$/s, { each: true })
  steps: string[];
}

const McpInsightRunArgs = IntersectionType(McpClusterArgs, ReadWebAnalyticsTimeZoneQuery);

export class McpEventsFunnelArgs extends IntersectionType(
  McpInsightRunArgs,
  PickType(WebAnalyticsChartBody, ['days', 'events', 'filters'] as const),
) {}

export class McpTrendArgs extends IntersectionType(
  McpInsightRunArgs,
  PickType(WebAnalyticsChartBody, ['days', 'events', 'filters', 'bucket', 'measure'] as const),
) {}

export class McpDistributionArgs extends IntersectionType(
  McpInsightRunArgs,
  PickType(WebAnalyticsChartBody, [
    'days',
    'events',
    'filters',
    'measure',
    'property',
    'binSize',
  ] as const),
) {}

export class McpCohortTableArgs extends IntersectionType(
  McpInsightRunArgs,
  PickType(WebAnalyticsChartBody, ['days', 'events', 'filters', 'bucket', 'property'] as const),
) {}

export class McpCreateInsightArgs extends IntersectionType(
  McpClusterArgs,
  WebAnalyticsInsightBody,
) {}

export class McpUpdateInsightArgs extends IntersectionType(
  McpInsightIdArgs,
  WebAnalyticsInsightBody,
) {}

export class McpLogsSearchArgs extends ReadWebAnalyticsSchemaQuery {
  @IsMongoId()
  projectId: string;

  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  namespace?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  namespacePrefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cursor?: string;
}
