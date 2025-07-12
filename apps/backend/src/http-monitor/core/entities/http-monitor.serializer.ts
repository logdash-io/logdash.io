import { HttpMonitorStatus } from '../../status/enum/http-monitor-status.enum';
import { HttpMonitorEntity } from './http-monitor.entity';
import { HttpMonitorNormalized, HttpMonitorSerialized } from './http-monitor.interface';
import { HttpMonitorStatusDto } from '../../status/http-monitor-status.service';

export class HttpMonitorSerializer {
  public static normalize(entity: HttpMonitorEntity): HttpMonitorNormalized {
    return {
      id: entity._id.toString(),
      projectId: entity.projectId,
      name: entity.name,
      url: entity.url,
      notificationChannelsIds: entity.notificationChannelsIds,
      mode: entity.mode,
    };
  }

  public static normalizeMany(entities: HttpMonitorEntity[]): HttpMonitorNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(
    normalized: HttpMonitorNormalized,
    status: HttpMonitorStatusDto,
  ): HttpMonitorSerialized {
    return {
      id: normalized.id,
      projectId: normalized.projectId,
      name: normalized.name,
      url: normalized.url,
      notificationChannelsIds: normalized.notificationChannelsIds,
      mode: normalized.mode,
      lastStatus: status.status,
      lastStatusCode: +status.statusCode,
    };
  }

  public static serializeMany(
    normalized: HttpMonitorNormalized[],
    params: { statuses: Record<string, HttpMonitorStatusDto> },
  ): HttpMonitorSerialized[] {
    return normalized.map((entity) => this.serialize(entity, params.statuses[entity.id]));
  }
}
