import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';

export class RemoveMetricsDto {
  projectId: string;
  olderThan: Date;
  granularity: MetricGranularity;
}
