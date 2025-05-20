import { ApiProperty } from '@nestjs/swagger';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';
import { IsEnum } from 'class-validator';

export class ReadLogMetricsWithGranularityQuery {
  @ApiProperty({ enum: MetricGranularity, isArray: true })
  @IsEnum(MetricGranularity)
  granularity?: MetricGranularity;
}
