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

const toArray = ({ value }: { value: unknown }): unknown[] =>
  Array.isArray(value) ? value : [value].filter(Boolean);

export class ReadWebAnalyticsQuery {
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

  @ApiPropertyOptional({ example: 'Europe/Warsaw', default: 'UTC' })
  @IsOptional()
  @Validate(IsTimeZone)
  tz: string = 'UTC';

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description:
      'dimension:value, for example page:/pricing or country:PL, or prop.<key>:value for events with that property value, and for events without the key, visitors who sent it',
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

export class ReadWebAnalyticsVisitorQuery {
  @ApiPropertyOptional({ example: 'Europe/Warsaw', default: 'UTC' })
  @IsOptional()
  @Validate(IsTimeZone)
  tz: string = 'UTC';
}
