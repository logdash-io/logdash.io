import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional } from 'class-validator';

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
  @IsDateString()
  public startDate: string;

  @ApiProperty()
  @IsDateString()
  public endDate: string;

  @ApiProperty({
    description: 'UTC offset in hours (e.g., -5 for EST, 2 for CET). Defaults to 0 (UTC)',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseFloat(value) : 0))
  public utcOffsetHours?: number = 0;
}
