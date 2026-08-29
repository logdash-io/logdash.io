import { CreateLogDto } from './dto/create-log.dto';
import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { LogClickhouseEntity } from '../core/entities/log.clickhouse-entity';

@Injectable()
export class LogWriteService {
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

    // clickhouse does not bind query parameters inside a partition expression,
    // so the value is asserted to be a bare YYYYMMDD literal instead
    if (!/^\d{8}$/.test(partitionDate)) {
      throw new Error(`Invalid partition date: ${partitionDate}`);
    }

    await this.clickhouse.command({
      query: `ALTER TABLE logs DROP PARTITION '${partitionDate}'`,
    });
  }

  private convertDateToPartitionDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  public async removeByProjectId(projectId: string): Promise<void> {
    await this.clickhouse.command({
      query: `DELETE FROM logs WHERE project_id = {projectId:String}`,
      query_params: { projectId },
    });
  }
}
