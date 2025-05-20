import { LogLevel } from '../../../log/core/enums/log-level.enum';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';
import { PartialRecord } from '../../../shared/types/partial-record.type';

export interface LogMetricCreatedEvent {
  id: string;
  date: string;
  values: PartialRecord<LogLevel, number>;
  granularity: MetricGranularity;
  projectId: string;
}
