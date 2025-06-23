import { CreateLogDto } from './dto/create-log.dto';
import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { LogClickhouseEntity } from '../core/entities/log.clickhouse-entity';

@Injectable()
export class LogWriteClickhouseService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async create(dto: CreateLogDto): Promise<void> {
    const log = LogClickhouseEntity.fromCreateDto(dto);

    await this.clickhouse.insert({
      table: 'logs',
      values: [log],
      format: 'JSONEachRow',
    });
  }

  public async createMany(dtos: CreateLogDto[]): Promise<void> {
    if (dtos.length === 0) return;

    const logs = dtos.map(LogClickhouseEntity.fromCreateDto);

    const result = await this.clickhouse.insert({
      table: 'logs',
      values: logs,
      format: 'JSONEachRow',
    });

    console.log(result);
  }
}
