import { Injectable } from '@nestjs/common';
import { LogNormalized } from '../core/entities/log.interface';
import { LogSerializer } from '../core/entities/log.serializer';
import { LogReadDirection } from '../core/enums/log-read-direction.enum';
import { Logger } from '@logdash/js-sdk';
import { ClickHouseClient } from '@clickhouse/client';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { LogLevel } from '../core/enums/log-level.enum';

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

  public async readManyLastId(dto: {
    direction?: LogReadDirection;
    lastId?: string;
    level?: LogLevel;
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
          )`;
        if (dto.level) {
          query += ` AND l.level = {level:String}`;
        }
        query += ` ORDER BY l.created_at ASC, l.sequence_number ASC 
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
          )`;
        if (dto.level) {
          query += ` AND l.level = {level:String}`;
        }
        query += ` ORDER BY l.created_at DESC, l.sequence_number DESC 
          LIMIT {limit:UInt32}`;
      }
      queryParams = {
        projectId: dto.projectId,
        lastId: dto.lastId,
        limit: dto.limit,
      };
      if (dto.level) {
        queryParams.level = dto.level;
      }
    } else {
      query = `
        SELECT * FROM logs 
        WHERE project_id = {projectId:String}`;
      if (dto.level) {
        query += ` AND level = {level:String}`;
      }
      query += ` ORDER BY created_at DESC, sequence_number DESC 
        LIMIT {limit:UInt32}`;
      queryParams = {
        projectId: dto.projectId,
        limit: dto.limit,
      };
      if (dto.level) {
        queryParams.level = dto.level;
      }
    }

    const result = await this.clickhouse.query({
      query,
      query_params: queryParams,
    });
    const data = ((await result.json()) as any).data;

    return data.map((row: any) => LogSerializer.normalizeClickhouse(row));
  }

  public async readManyDateRange(dto: {
    startDate?: Date;
    endDate?: Date;
    limit: number;
    projectId: string;
    level?: LogLevel;
  }): Promise<LogNormalized[]> {
    let query = `SELECT * FROM logs WHERE project_id = {projectId:String}`;
    const queryParams: Record<string, any> = {
      projectId: dto.projectId,
      limit: dto.limit,
    };

    if (dto.startDate) {
      query += ` AND created_at >= {startDate:DateTime64(3)}`;
      queryParams.startDate = ClickhouseUtils.jsDateToClickhouseDate(dto.startDate);
    }

    if (dto.endDate) {
      query += ` AND created_at <= {endDate:DateTime64(3)}`;
      queryParams.endDate = ClickhouseUtils.jsDateToClickhouseDate(dto.endDate);
    }

    if (dto.level) {
      query += ` AND level = {level:String}`;
      queryParams.level = dto.level;
    }

    query += ` ORDER BY created_at DESC, sequence_number DESC LIMIT {limit:UInt32}`;

    const result = await this.clickhouse.query({
      query,
      query_params: queryParams,
    });
    const data = ((await result.json()) as any).data;

    return data.map((row: any) => LogSerializer.normalizeClickhouse(row));
  }
}
