import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';
import { parseFlexibleDate } from '../../../shared/utils/parse-flexible-date';
import { LogMetricsResponse } from '../dto/log-metrics.response';
import { LogMetricEntity } from './log-metric.entity';
import {
  LogMetricNormalized,
  LogMetricSerialized,
} from './log-metric.interface';

export class LogMetricSerializer {
  public static normalize(entity: LogMetricEntity): LogMetricNormalized {
    return {
      id: entity._id.toString(),
      timeBucket: entity.timeBucket,
      values: entity.values,
      granularity: entity.granularity,
    };
  }

  public static serialize(
    normalized: LogMetricNormalized,
  ): LogMetricSerialized {
    return {
      date:
        normalized.granularity === MetricGranularity.AllTime
          ? 'all-time'
          : parseFlexibleDate(normalized.timeBucket).toISOString(),
      values: normalized.values,
    };
  }

  public static prepareResponse(
    normalized: LogMetricNormalized[],
  ): LogMetricsResponse {
    return normalized.reduce(
      (acc, metric) => {
        acc[metric.granularity].push(LogMetricSerializer.serialize(metric));
        return acc;
      },
      {
        [MetricGranularity.Day]: [],
        [MetricGranularity.Hour]: [],
        [MetricGranularity.Minute]: [],
      },
    );
  }
}
