import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum } from 'class-validator';

export enum LogAnalyticsBucket {
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

  @ApiProperty({ enum: LogAnalyticsBucket })
  @IsEnum(LogAnalyticsBucket)
  @Transform(({ value }) => parseInt(value))
  public bucket: LogAnalyticsBucket;
}
