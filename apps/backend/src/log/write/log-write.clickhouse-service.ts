import { CreateLogDto } from './dto/create-log.dto';
import { LogLevel } from '../core/enums/log-level.enum';
import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';

const ourLogLevelToClickhouseLogLevel: Record<LogLevel, number> = {
  [LogLevel.Info]: 1,
  [LogLevel.Warning]: 2,
  [LogLevel.Error]: 3,
  [LogLevel.Silly]: 4,
  [LogLevel.Http]: 5,
  [LogLevel.Debug]: 6,
  [LogLevel.Verbose]: 7,
};

interface ClickhouseLog {
  id: string;
  created_at: string;
  message: string;
  level: number;
  project_id: string;
  sequence_number: number;
}

@Injectable()
export class LogWriteClickhouseService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async create(dto: CreateLogDto): Promise<void> {
    const log = this.mapDtoToClickhouseLog(dto);

    await this.clickhouse.insert({
      table: 'logs',
      values: [log],
      format: 'JSONEachRow',
    });
  }

  public async createMany(dtos: CreateLogDto[]): Promise<void> {
    if (dtos.length === 0) return;

    const logs = dtos.map(this.mapDtoToClickhouseLog);

    const result = await this.clickhouse.insert({
      table: 'logs',
      values: logs,
      format: 'JSONEachRow',
    });
  }

  private mapDtoToClickhouseLog(dto: CreateLogDto): ClickhouseLog {
    return {
      id: dto.id,
      created_at: ClickhouseUtils.jsDateToClickhouseDate(dto.createdAt),
      message: dto.message,
      level: ourLogLevelToClickhouseLogLevel[dto.level],
      project_id: dto.projectId,
      sequence_number: dto.sequenceNumber ?? 0,
    };
  }
}
