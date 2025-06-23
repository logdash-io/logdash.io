import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { LogEntity } from '../core/entities/log.entity';
import { LogNormalized } from '../core/entities/log.interface';
import { LogSerializer } from '../core/entities/log.serializer';
import { LogReadDirection } from '../core/enums/log-read-direction.enum';
import { Logger } from '@logdash/js-sdk';
import { ClickHouseClient } from '@clickhouse/client';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';

@Injectable()
export class LogReadService {
  constructor(
    private readonly clickhouse: ClickHouseClient,
    private logger: Logger,
  ) {}

  public async existsForProject(projectId: string): Promise<boolean> {
    const result = await this.clickhouse.query({
      query: `SELECT 1 FROM logs WHERE projectId = '${projectId}' LIMIT 1`,
    });

    const data = (await result.json()) as any;

    return data.length > 0;
  }

  public async readMany(dto: {
    direction?: LogReadDirection;
    lastId?: string;
    limit: number;
    projectId: string;
  }): Promise<LogNormalized[]> {
    let query = `SELECT * FROM logs WHERE project_id = '${dto.projectId}'`;

    if (dto.lastId && dto.direction) {
      const operator = dto.direction === LogReadDirection.After ? '>' : '<';
      query += ` AND id ${operator} '${dto.lastId}'`;
    }

    query += ` ORDER BY id ASC LIMIT ${dto.limit}`;

    const result = await this.clickhouse.query({ query });
    const data = ((await result.json()) as any).data;

    return data.map((row: any) => ({
      id: row.id,
      createdAt: ClickhouseUtils.clickhouseDateToJsDate(row.created_at),
      message: row.message,
      level: row.level,
      projectId: row.project_id,
      index: row.sequence_number,
    }));
  }
}
