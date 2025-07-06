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
  }

  public async removePartition(cutOffDate: Date): Promise<void> {
    const partitionDate = this.convertDateToPartitionDate(cutOffDate);

    await this.clickhouse.query({
      query: `ALTER TABLE logs DROP PARTITION '${partitionDate}'`,
    });
  }

  private convertDateToPartitionDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  public async removeByProjectId(projectId: string): Promise<void> {
    await this.clickhouse.query({
      query: `DELETE FROM logs WHERE project_id = '${projectId}'`,
    });
  }
}
