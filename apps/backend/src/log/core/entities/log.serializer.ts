import { LogEntity } from './log.entity';
import { LogNormalized, LogSerialized } from './log.interface';

export class LogSerializer {
  public static normalize(entity: LogEntity): LogNormalized {
    return {
      id: entity._id.toString(),
      createdAt: entity.createdAt,
      message: entity.message,
      level: entity.level,
      projectId: entity.projectId,
      index: entity.index,
    };
  }

  public static serialize(normalized: LogNormalized): LogSerialized {
    return {
      id: normalized.id,
      createdAt: normalized.createdAt.toISOString(),
      message: normalized.message,
      level: normalized.level,
      index: normalized.index,
    };
  }
}
