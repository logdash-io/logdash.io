import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EVENT_NAME } from './collect-web-events.body';

export enum WebAnalyticsGranularity {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

export const WEB_ANALYTICS_FILTER_DIMENSIONS = [
  'channel',
  'referrer',
  'campaign',
  'keyword',
  'hostname',
  'page',
  'country',
  'browser',
  'os',
  'device',
  'goal',
  'app',
] as const;

export type WebAnalyticsFilterDimension = (typeof WEB_ANALYTICS_FILTER_DIMENSIONS)[number];

export const WEB_ANALYTICS_BREAKDOWNS = [
  'channels',
  'referrers',
  'campaigns',
  'keywords',
  'hostnames',
  'pages',
  'entryPages',
  'exitPages',
  'countries',
  'browsers',
  'os',
  'devices',
  'goals',
] as const;

export type WebAnalyticsBreakdownName = (typeof WEB_ANALYTICS_BREAKDOWNS)[number];

export const WEB_ANALYTICS_VISIT_SHOWS = ['all', 'stayed', 'goal'] as const;

export type WebAnalyticsVisitShow = (typeof WEB_ANALYTICS_VISIT_SHOWS)[number];

export function isLocalDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

@ValidatorConstraint({ name: 'timeZone' })
class IsTimeZone implements ValidatorConstraintInterface {
  public validate(value: unknown): boolean {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_+\-/]{1,64}$/.test(value)) return false;
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }

  public defaultMessage(): string {
    return 'tz must be an IANA time zone';
  }
}

@ValidatorConstraint({ name: 'localDate' })
class IsLocalDate implements ValidatorConstraintInterface {
  public validate(value: unknown): boolean {
    return isLocalDate(value);
  }

  public defaultMessage(): string {
    return 'date must be a day as YYYY-MM-DD';
  }
}

const toArray = ({ value }: { value: unknown }): unknown[] =>
  Array.isArray(value) ? value : [value].filter(Boolean);

export class ReadWebAnalyticsTimeZoneQuery {
  @ApiPropertyOptional({ example: 'Europe/Warsaw', default: 'UTC' })
  @IsOptional()
  @Validate(IsTimeZone)
  tz: string = 'UTC';
}

export class ReadWebAnalyticsFilterQuery extends ReadWebAnalyticsTimeZoneQuery {
  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description:
      'dimension:value, for example page:/pricing or country:PL, or prop.<key>:value for events with that property value, and for events without the key, visitors who sent it. goal:<event> and app:<app or website hostname> keep the visitors who sent that event or used that app.',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(1100, { each: true })
  @Matches(
    new RegExp(
      `^(${WEB_ANALYTICS_FILTER_DIMENSIONS.join('|')}|prop\\.[a-z][a-z0-9_]{0,39}):.+$`,
      's',
    ),
    { each: true },
  )
  filter: string[] = [];
}

export class ReadWebAnalyticsQuery extends ReadWebAnalyticsFilterQuery {
  @ApiProperty({ example: '2026-09-25T22:00:00.000Z' })
  @Transform(({ value }: { value: string }) => new Date(value))
  @IsDate()
  from: Date;

  @ApiProperty({ example: '2026-10-02T12:00:00.000Z' })
  @Transform(({ value }: { value: string }) => new Date(value))
  @IsDate()
  to: Date;

  @ApiPropertyOptional({ enum: WebAnalyticsGranularity, default: WebAnalyticsGranularity.Day })
  @IsOptional()
  @IsEnum(WebAnalyticsGranularity)
  granularity: WebAnalyticsGranularity = WebAnalyticsGranularity.Day;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(
    ({ obj }: { obj: { compare?: unknown } }) => obj.compare === true || obj.compare === 'true',
  )
  @IsBoolean()
  compare: boolean = false;
}

export class ReadWebAnalyticsBreakdownQuery extends ReadWebAnalyticsQuery {
  @ApiProperty({ enum: WEB_ANALYTICS_BREAKDOWNS })
  @IsIn(WEB_ANALYTICS_BREAKDOWNS)
  dimension: WebAnalyticsBreakdownName;
}

export class ReadWebAnalyticsFunnelQuery extends ReadWebAnalyticsQuery {
  @ApiProperty({ type: String, isArray: true, example: ['page:/', 'goal:signup_completed'] })
  @Transform(toArray)
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(1100, { each: true })
  @Matches(/^(page|goal):.+$/s, { each: true })
  step: string[];
}

export class ReadWebAnalyticsVisitorsQuery extends ReadWebAnalyticsQuery {
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(10_000)
  offset: number = 0;
}

export class ReadWebAnalyticsDayQuery extends ReadWebAnalyticsFilterQuery {
  @ApiPropertyOptional({
    type: String,
    isArray: true,
    example: ['signup', 'download'],
    description:
      'Up to 10 goals, by custom event name. Each goal is counted on its own, and goal counts follow this order',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Matches(EVENT_NAME, { each: true })
  goal: string[] = [];
}

export class ReadWebAnalyticsDaysQuery extends ReadWebAnalyticsDayQuery {
  @ApiPropertyOptional({
    example: '2026-10-25',
    description: 'Any day of the 28-day page to read, as YYYY-MM-DD in tz. Defaults to today',
  })
  @IsOptional()
  @Validate(IsLocalDate)
  date?: string;
}

export class ReadWebAnalyticsDayVisitsQuery extends ReadWebAnalyticsDayQuery {
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(10_000)
  offset: number = 0;

  @ApiPropertyOptional({
    enum: WEB_ANALYTICS_VISIT_SHOWS,
    default: 'all',
    description:
      'all, stayed for visits that stayed, or goal for visits that reached a requested goal',
  })
  @IsOptional()
  @IsIn(WEB_ANALYTICS_VISIT_SHOWS)
  show: WebAnalyticsVisitShow = 'all';
}
