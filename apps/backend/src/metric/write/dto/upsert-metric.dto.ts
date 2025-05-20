import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';

export class UpsertMetricDto {
  metricRegisterEntryId: string;
  timeBucket: string;
  granularity: MetricGranularity;
  value: number;
  projectId: string;
}
