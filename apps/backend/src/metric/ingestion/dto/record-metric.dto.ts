import { MetricOperation } from '../../core/enums/metric-operation.enum';

export class RecordMetricDto {
  name: string;
  value: number;
  operation: MetricOperation;
  projectId: string;
}
