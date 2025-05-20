import { LogLevel } from '../../../log/core/enums/log-level.enum';
import { PartialRecord } from '../../../shared/types/partial-record.type';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';

export class UpsertLogMetricDto {
  timeBucket: string;
  granularity: MetricGranularity;
  values: PartialRecord<LogLevel, number>;
  projectId: string;
}
