import { MetricRegisterEntryEntity } from './metric-register-entry.entity';
import { MetricRegisterEntryNormalized } from './metric-register-entry.normalized';

export class MetricRegisterEntrySerializer {
  public static normalize(entity: MetricRegisterEntryEntity): MetricRegisterEntryNormalized {
    return {
      id: entity._id.toString(),
      name: entity.name,
      projectId: entity.projectId,
    };
  }
}
