import { ApiProperty } from '@nestjs/swagger';
import { LogLevel } from '../../core/enums/log-level.enum';

export class LogAnalyticsBucketData {
  @ApiProperty()
  public bucketStart: string;

  @ApiProperty()
  public bucketEnd: string;

  @ApiProperty()
  public infoCount: number;

  @ApiProperty()
  public warningCount: number;

  @ApiProperty()
  public errorCount: number;

  @ApiProperty()
  public httpCount: number;

  @ApiProperty()
  public verboseCount: number;

  @ApiProperty()
  public debugCount: number;

  @ApiProperty()
  public sillyCount: number;

  @ApiProperty()
  public totalCount: number;
}

export class LogAnalyticsResponse {
  @ApiProperty({ type: [LogAnalyticsBucketData] })
  public buckets: LogAnalyticsBucketData[];

  @ApiProperty()
  public totalLogs: number;

  @ApiProperty()
  public bucketSizeMinutes: number;
}
