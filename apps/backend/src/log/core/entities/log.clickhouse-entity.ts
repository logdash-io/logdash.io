import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { CreateLogDto } from '../../write/dto/create-log.dto';
import { LogLevel } from '../enums/log-level.enum';
import { LogNormalized } from './log.interface';

export const ourLogLevelToClickhouseLogLevel: Record<LogLevel, number> = {
  [LogLevel.Info]: 1,
  [LogLevel.Warning]: 2,
  [LogLevel.Error]: 3,
  [LogLevel.Silly]: 4,
  [LogLevel.Http]: 5,
  [LogLevel.Debug]: 6,
  [LogLevel.Verbose]: 7,
};

export class LogClickhouseEntity {
  id: string;

  project_id: string;

  created_at: string;

  sequence_number: number;

  level: number;

  message: string;

  public static fromCreateDto(dto: CreateLogDto): LogClickhouseEntity {
    return {
      id: dto.id,
      project_id: dto.projectId,
      created_at: ClickhouseUtils.jsDateToClickhouseDate(dto.createdAt),
      sequence_number: dto.sequenceNumber ?? 0,
      level: ourLogLevelToClickhouseLogLevel[dto.level],
      message: dto.message,
    };
  }
}
