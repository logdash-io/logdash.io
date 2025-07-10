import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { CreateClickhouseMetricDto } from '../../write/dto/create-clickhouse-metric.dto';

export class MetricClickhouseEntity {
  id: string;

  metric_register_entry_id: string;

  recorded_at: string;

  value: number;

  public static fromCreateClickhouseMetricDto(
    metric: CreateClickhouseMetricDto,
  ): MetricClickhouseEntity {
    return {
      id: metric.id,
      metric_register_entry_id: metric.metricRegisterEntryId,
      recorded_at: ClickhouseUtils.jsDateToClickhouseDate(metric.recordedAt),
      value: metric.value,
    };
  }
}
