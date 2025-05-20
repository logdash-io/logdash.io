import { HttpMonitorEntity } from './http-monitor.entity';
import {
  HttpMonitorNormalized,
  HttpMonitorSerialized,
} from './http-monitor.interface';

export class HttpMonitorSerializer {
  public static normalize(entity: HttpMonitorEntity): HttpMonitorNormalized {
    return {
      id: entity._id.toString(),
      clusterId: entity.clusterId,
      name: entity.name,
      url: entity.url,
    };
  }

  public static normalizeMany(
    entities: HttpMonitorEntity[],
  ): HttpMonitorNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(
    normalized: HttpMonitorNormalized,
  ): HttpMonitorSerialized {
    return {
      id: normalized.id,
      clusterId: normalized.clusterId,
      name: normalized.name,
      url: normalized.url,
    };
  }

  public static serializeMany(
    normalized: HttpMonitorNormalized[],
  ): HttpMonitorSerialized[] {
    return normalized.map((entity) => this.serialize(entity));
  }
}
