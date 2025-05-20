import { HttpPingEntity } from './http-ping.entity';
import { HttpPingNormalized, HttpPingSerialized } from './http-ping.interface';

export class HttpPingSerializer {
  public static normalize(entity: HttpPingEntity): HttpPingNormalized {
    return {
      id: entity._id.toString(),
      httpMonitorId: entity.httpMonitorId,
      statusCode: entity.statusCode,
      responseTimeMs: entity.responseTimeMs,
      message: entity.message,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static normalizeMany(entities: HttpPingEntity[]): HttpPingNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(normalized: HttpPingNormalized): HttpPingSerialized {
    return {
      id: normalized.id,
      httpMonitorId: normalized.httpMonitorId,
      statusCode: normalized.statusCode,
      responseTimeMs: normalized.responseTimeMs,
      message: normalized.message,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
    };
  }

  public static serializeMany(normalized: HttpPingNormalized[]): HttpPingSerialized[] {
    return normalized.map((entity) => this.serialize(entity));
  }
}
