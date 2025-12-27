import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { LogLevel } from '../enums/log-level.enum';
import { LogClickhouseEntity } from './log.clickhouse-entity';
import { LogEntity } from './log.entity';
import {
  LogClickhouseNormalized,
  LogClickhouseSerialized,
  LogNormalized,
  LogSerialized,
} from './log.interface';

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

  public static normalizeClickhouse(entity: LogClickhouseEntity): LogClickhouseNormalized {
    return {
      id: entity.id,
      createdAt: ClickhouseUtils.clickhouseDateToJsDate(entity.created_at),
      message: entity.message,
      level: entity.level as unknown as LogLevel,
      projectId: entity.project_id,
      sequenceNumber: entity.sequence_number,
      namespace: entity.namespace ?? undefined,
    };
  }

  public static serialize(normalized: LogNormalized): LogSerialized {
    return {
      id: normalized.id,
      createdAt: normalized.createdAt.toISOString(),
      message: normalized.message,
      level: normalized.level,
      index: normalized.index,
      namespace: normalized.namespace,
    };
  }

  public static serializeClickhouse(normalized: LogClickhouseNormalized): LogClickhouseSerialized {
    return {
      id: normalized.id,
      createdAt: normalized.createdAt.toISOString(),
      message: normalized.message,
      level: normalized.level,
      sequenceNumber: normalized.sequenceNumber,
      namespace: normalized.namespace,
    };
  }
}
