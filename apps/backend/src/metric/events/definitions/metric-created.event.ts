import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';

export interface MetricCreatedEvent {
  metricRegisterEntryId: string;
  date: string;
  name: string;
  value: number;
  granularity: MetricGranularity;
  projectId: string;
}
