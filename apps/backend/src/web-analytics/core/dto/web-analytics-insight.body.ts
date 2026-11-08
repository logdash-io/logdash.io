import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { EVENT_NAME, PROP_KEY } from './collect-web-events.body';
import { WebAnalyticsGranularity } from './read-web-analytics.query';

export enum WebAnalyticsInsightType {
  Funnel = 'funnel',
  Trend = 'trend',
  Distribution = 'distribution',
  Cohorts = 'cohorts',
}

export enum WebAnalyticsFunnelMode {
  People = 'people',
  Events = 'events',
}

export enum WebAnalyticsFunnelLayout {
  Columns = 'columns',
  Rows = 'rows',
}

export enum WebAnalyticsInsightOperator {
  Eq = 'eq',
  Neq = 'neq',
  Gt = 'gt',
  Gte = 'gte',
  Lt = 'lt',
  Lte = 'lte',
}

export const WEB_ANALYTICS_INSIGHT_BUCKETS = [
  WebAnalyticsGranularity.Day,
  WebAnalyticsGranularity.Week,
  WebAnalyticsGranularity.Month,
] as const;

export type WebAnalyticsInsightBucket = (typeof WEB_ANALYTICS_INSIGHT_BUCKETS)[number];

export const MAX_WEB_ANALYTICS_INSIGHTS = 50;

export class WebAnalyticsInsightFilterBody {
  @ApiProperty({ example: 'cohort', description: 'Event property key' })
  @IsString()
  @Matches(PROP_KEY)
  key: string;

  @ApiProperty({
    enum: WebAnalyticsInsightOperator,
    description:
      'gt, gte, lt and lte compare numbers when the value is a number, and text otherwise, so YYYY-MM-DD dates compare in order',
  })
  @IsEnum(WebAnalyticsInsightOperator)
  op: WebAnalyticsInsightOperator;

  @ApiProperty({ example: '2026-11-01' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  value: string;
}

export class WebAnalyticsInsightEventBody {
  @ApiProperty({ example: 'signup_completed' })
  @IsString()
  @Matches(EVENT_NAME)
  name: string;

  @ApiPropertyOptional({
    type: WebAnalyticsInsightFilterBody,
    isArray: true,
    description: 'Property filters this event must match',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WebAnalyticsInsightFilterBody)
  filters: WebAnalyticsInsightFilterBody[] = [];
}

export class WebAnalyticsInsightBody {
  @ApiProperty({
    enum: WebAnalyticsInsightType,
    description:
      'funnel counts each step, trend counts events per bucket, distribution histograms a numeric property, cohorts groups a start event and later events by a date property',
  })
  @IsEnum(WebAnalyticsInsightType)
  type: WebAnalyticsInsightType;

  @ApiProperty({ example: 'Install journey' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title: string;

  @ApiPropertyOptional({
    default: 30,
    description: 'The last N days, cut to the retention of the plan',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  days: number = 30;

  @ApiPropertyOptional({
    enum: WebAnalyticsFunnelMode,
    default: WebAnalyticsFunnelMode.Events,
    description:
      'Funnels only. people follows each visitor or user through steps; events counts the events of each step',
  })
  @IsOptional()
  @IsEnum(WebAnalyticsFunnelMode)
  mode?: WebAnalyticsFunnelMode;

  @ApiPropertyOptional({
    enum: WebAnalyticsFunnelLayout,
    default: WebAnalyticsFunnelLayout.Columns,
    description:
      'Funnels only. columns draws a bar per step with the drop between bars; rows lists the steps, which fits long names in half the width',
  })
  @IsOptional()
  @IsEnum(WebAnalyticsFunnelLayout)
  layout?: WebAnalyticsFunnelLayout;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    example: ['page:/', 'goal:signup_completed'],
    description: 'People funnels only: 2 to 8 steps, each page:<path> or goal:<event>',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(1100, { each: true })
  @Matches(/^(page|goal):.+$/s, { each: true })
  steps: string[] = [];

  @ApiPropertyOptional({
    type: WebAnalyticsInsightEventBody,
    isArray: true,
    description:
      'Event funnel steps (2 to 8), trend series (1 to 5), the one distribution event, or the cohort start event then up to 7 later events',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => WebAnalyticsInsightEventBody)
  events: WebAnalyticsInsightEventBody[] = [];

  @ApiPropertyOptional({
    type: WebAnalyticsInsightFilterBody,
    isArray: true,
    description: 'Property filters every event must match, such as a cohort date range',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WebAnalyticsInsightFilterBody)
  filters: WebAnalyticsInsightFilterBody[] = [];

  @ApiPropertyOptional({
    enum: WEB_ANALYTICS_INSIGHT_BUCKETS,
    description: 'Trends: day by default. Cohorts: the cohort row size, week by default',
  })
  @IsOptional()
  @IsIn(WEB_ANALYTICS_INSIGHT_BUCKETS)
  bucket?: WebAnalyticsInsightBucket;

  @ApiPropertyOptional({
    example: 'active_days',
    description:
      'Distributions: the numeric property. Cohorts: the YYYY-MM-DD property that names the cohort, cohort by default',
  })
  @IsOptional()
  @IsString()
  @Matches(PROP_KEY)
  property?: string;

  @ApiPropertyOptional({ default: 1, description: 'Distributions only: the width of a bar' })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.000001)
  @Max(1_000_000_000)
  binSize?: number;
}

export class ReorderWebAnalyticsInsightsBody {
  @ApiProperty({ type: String, isArray: true, description: 'Every insight id, in the new order' })
  @IsArray()
  @ArrayMaxSize(MAX_WEB_ANALYTICS_INSIGHTS)
  @ArrayUnique()
  @IsMongoId({ each: true })
  ids: string[];
}

export type WebAnalyticsInsightFilter = {
  key: string;
  op: WebAnalyticsInsightOperator;
  value: string;
};

export type WebAnalyticsInsightEvent = { name: string; filters: WebAnalyticsInsightFilter[] };

export type WebAnalyticsInsightConfig = {
  type: WebAnalyticsInsightType;
  title: string;
  days: number;
  mode?: WebAnalyticsFunnelMode;
  layout?: WebAnalyticsFunnelLayout;
  steps?: string[];
  events?: WebAnalyticsInsightEvent[];
  filters?: WebAnalyticsInsightFilter[];
  bucket?: WebAnalyticsInsightBucket;
  property?: string;
  binSize?: number;
};

export function normalizeWebAnalyticsInsight(
  body: WebAnalyticsInsightBody,
): WebAnalyticsInsightConfig {
  const base = { type: body.type, title: body.title.trim(), days: body.days ?? 30 };
  if (!base.title) throw new BadRequestException('title must not be blank');
  const events = (body.events ?? []).map((event) => ({
    name: event.name,
    filters: (event.filters ?? []).map(({ key, op, value }) => ({ key, op, value })),
  }));
  const filters = (body.filters ?? []).map(({ key, op, value }) => ({ key, op, value }));
  const count = (min: number, max: number, what: string): void => {
    if (events.length < min || events.length > max)
      throw new BadRequestException(
        min === max ? `A ${what} takes ${min} event` : `A ${what} takes ${min} to ${max} events`,
      );
  };
  if (body.type === WebAnalyticsInsightType.Funnel) {
    const layout = body.layout ?? WebAnalyticsFunnelLayout.Columns;
    if ((body.mode ?? WebAnalyticsFunnelMode.Events) === WebAnalyticsFunnelMode.People) {
      if ((body.steps ?? []).length < 2)
        throw new BadRequestException('A people funnel takes 2 to 8 steps');
      return { ...base, mode: WebAnalyticsFunnelMode.People, layout, steps: body.steps };
    }
    count(2, 8, 'events funnel');
    return { ...base, mode: WebAnalyticsFunnelMode.Events, layout, events, filters };
  }
  if (body.type === WebAnalyticsInsightType.Trend) {
    count(1, 5, 'trend');
    return { ...base, events, filters, bucket: body.bucket ?? WebAnalyticsGranularity.Day };
  }
  if (body.type === WebAnalyticsInsightType.Distribution) {
    count(1, 1, 'distribution');
    if (!body.property) throw new BadRequestException('A distribution takes a numeric property');
    return { ...base, events, filters, property: body.property, binSize: body.binSize ?? 1 };
  }
  count(2, 8, 'cohort table');
  return {
    ...base,
    events,
    filters,
    bucket: body.bucket ?? WebAnalyticsGranularity.Week,
    property: body.property ?? 'cohort',
  };
}
