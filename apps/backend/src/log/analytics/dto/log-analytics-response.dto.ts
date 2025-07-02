import { ApiProperty } from '@nestjs/swagger';
import { LogLevel } from '../../core/enums/log-level.enum';

export class LogAnalyticsBucketData {
  @ApiProperty()
  public bucketStart: string;

  @ApiProperty()
  public bucketEnd: string;

  @ApiProperty({
    description: 'Count of logs by level',
    example: {
      [LogLevel.Info]: 5,
      [LogLevel.Warning]: 2,
      [LogLevel.Error]: 1,
      [LogLevel.Http]: 10,
      [LogLevel.Verbose]: 0,
      [LogLevel.Debug]: 3,
      [LogLevel.Silly]: 0,
    },
  })
  public countByLevel: Record<LogLevel, number>;

  @ApiProperty()
  public countTotal: number;
}

export class LogAnalyticsResponse {
  @ApiProperty({ type: [LogAnalyticsBucketData] })
  public buckets: LogAnalyticsBucketData[];

  @ApiProperty()
  public totalLogs: number;

  @ApiProperty()
  public bucketSizeMinutes: number;
}
