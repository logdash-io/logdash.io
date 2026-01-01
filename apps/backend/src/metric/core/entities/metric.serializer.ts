import { normalize } from 'path';
import { MetricRegisterEntryNormalized } from '../../../metric-register/core/entities/metric-register-entry.normalized';
import { parseFlexibleDate } from '../../../shared/utils/parse-flexible-date';
import { MetricEntity } from './metric.entity';
import { MetricNormalized, MetricSerialized } from './metric.normalized';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';

export class MetricSerializer {
  public static normalize(entity: MetricEntity): MetricNormalized {
    return {
      id: entity._id.toString(),
      timeBucket: entity.timeBucket,
      metricRegisterEntryId: entity.metricRegisterEntryId,
      value: entity.value,
      projectId: entity.projectId,
      granularity: entity.granularity,
    };
  }

  public static serializeMany(
    normalizedMetrics: MetricNormalized[],
    normalizedRegisterEntries: MetricRegisterEntryNormalized[],
  ): MetricSerialized[] {
    return normalizedMetrics.map((normalized) => ({
      id: normalized.id,
      date:
        normalized.granularity === MetricGranularity.AllTime
          ? 'all-time'
          : parseFlexibleDate(normalized.timeBucket).toISOString(),
      name:
        normalizedRegisterEntries.find((entry) => entry.id === normalized.metricRegisterEntryId)
          ?.name || 'unknown',
      value: normalized.value,
      metricRegisterEntryId: normalized.metricRegisterEntryId,
      granularity: normalized.granularity,
    }));
  }
}
