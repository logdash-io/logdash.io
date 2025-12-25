import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { LogLevel } from '../../core/enums/log-level.enum';

export enum LogAnalyticsBucket {
  OneMinute = 1,
  FiveMinutes = 5,
  TenMinutes = 10,
  FifteenMinutes = 15,
  TwentyMinutes = 20,
  ThirtyMinutes = 30,
  OneHour = 60,
  TwoHours = 120,
  FourHours = 240,
  EightHours = 480,
  TwelveHours = 720,
  TwentyFourHours = 1440,
}

export class LogAnalyticsQuery {
  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  public startDate: Date;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  public endDate: Date;

  @ApiProperty({
    description: 'UTC offset in hours (e.g., -5 for EST, 2 for CET). Defaults to 0 (UTC)',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseFloat(value) : 0))
  public utcOffsetHours?: number = 0;

  @ApiPropertyOptional({
    enum: LogLevel,
    isArray: true,
    description: 'Filter analytics by multiple log levels.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LogLevel, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value].filter(Boolean)))
  public levels?: LogLevel[];
}
