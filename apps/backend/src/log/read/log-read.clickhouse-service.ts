import { Injectable } from '@nestjs/common';
import { LogNormalized } from '../core/entities/log.interface';
import { LogSerializer } from '../core/entities/log.serializer';
import { LogReadDirection } from '../core/enums/log-read-direction.enum';
import { Logger } from '@logdash/js-sdk';
import { ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class LogReadClickhouseService {
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
    let query: string;
    let queryParams: Record<string, any>;

    if (dto.lastId && dto.direction) {
      if (dto.direction === LogReadDirection.After) {
        query = `
          SELECT l.* FROM logs l
          WHERE l.project_id = {projectId:String}
          AND (l.created_at, l.sequence_number) > (
            SELECT created_at, sequence_number 
            FROM logs 
            WHERE id = {lastId:String} AND project_id = {projectId:String}
            LIMIT 1
          )
          ORDER BY l.created_at DESC, l.sequence_number DESC 
          LIMIT {limit:UInt32}`;
      } else {
        query = `
          SELECT l.* FROM logs l
          WHERE l.project_id = {projectId:String}
          AND (l.created_at, l.sequence_number) < (
            SELECT created_at, sequence_number 
            FROM logs 
            WHERE id = {lastId:String} AND project_id = {projectId:String}
            LIMIT 1
          )
          ORDER BY l.created_at DESC, l.sequence_number DESC 
          LIMIT {limit:UInt32}`;
      }
      queryParams = {
        projectId: dto.projectId,
        lastId: dto.lastId,
        limit: dto.limit,
      };
    } else {
      query = `
        SELECT * FROM logs 
        WHERE project_id = {projectId:String}
        ORDER BY created_at DESC, sequence_number DESC 
        LIMIT {limit:UInt32}`;
      queryParams = {
        projectId: dto.projectId,
        limit: dto.limit,
      };
    }

    const result = await this.clickhouse.query({
      query,
      query_params: queryParams,
    });
    const data = ((await result.json()) as any).data;

    return data.map((row: any) => LogSerializer.normalizeClickhouse(row));
  }
}
