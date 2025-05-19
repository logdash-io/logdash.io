import { ApiProperty } from '@nestjs/swagger';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';
import { LogMetricSerialized } from '../entities/log-metric.interface';

export class LogMetricsResponse {
  @ApiProperty({ type: LogMetricSerialized, isArray: true })
  [MetricGranularity.Day]: LogMetricSerialized[];
  @ApiProperty({ type: LogMetricSerialized, isArray: true })
  [MetricGranularity.Hour]: LogMetricSerialized[];
  @ApiProperty({ type: LogMetricSerialized, isArray: true })
  [MetricGranularity.Minute]: LogMetricSerialized[];
}
