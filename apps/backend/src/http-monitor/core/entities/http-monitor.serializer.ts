import { HttpMonitorEntity } from './http-monitor.entity';
import { HttpMonitorNormalized, HttpMonitorSerialized } from './http-monitor.interface';

export class HttpMonitorSerializer {
  public static normalize(entity: HttpMonitorEntity): HttpMonitorNormalized {
    return {
      id: entity._id.toString(),
      projectId: entity.projectId,
      name: entity.name,
      url: entity.url,
      notificationChannelIds: entity.notificationChannelIds,
    };
  }

  public static normalizeMany(entities: HttpMonitorEntity[]): HttpMonitorNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(normalized: HttpMonitorNormalized): HttpMonitorSerialized {
    return {
      id: normalized.id,
      projectId: normalized.projectId,
      name: normalized.name,
      url: normalized.url,
      notificationChannelIds: normalized.notificationChannelIds,
    };
  }

  public static serializeMany(normalized: HttpMonitorNormalized[]): HttpMonitorSerialized[] {
    return normalized.map((entity) => this.serialize(entity));
  }
}
