import { ApiProperty } from '@nestjs/swagger';
import { LogLevel } from '../../../log/core/enums/log-level.enum';
import { PartialRecord } from '../../../shared/types/partial-record.type';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';

export class LogMetricNormalized {
  id: string;
  timeBucket: string;
  values: PartialRecord<LogLevel, number>;
  granularity: MetricGranularity;
}

export class LogMetricSerialized {
  @ApiProperty()
  date: string;

  @ApiProperty()
  values: PartialRecord<LogLevel, number>;
}
