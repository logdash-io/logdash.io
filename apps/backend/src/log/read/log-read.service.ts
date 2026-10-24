import { Injectable } from '@nestjs/common';
import { LogClickhouseNormalized } from '../core/entities/log.interface';
import { LogSerializer } from '../core/entities/log.serializer';
import { LogReadDirection } from '../core/enums/log-read-direction.enum';
import { ClickHouseClient } from '@clickhouse/client';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { LogLevel } from '../core/enums/log-level.enum';
import { NamespaceMetadata } from './dto/namespace-metadata.dto';
import { LogClickhouseRow } from '../core/entities/log.clickhouse-entity';

@Injectable()
export class LogReadService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async existsForProject(projectId: string): Promise<boolean> {
    const result = await this.clickhouse.query({
      query: `SELECT 1 FROM logs WHERE project_id = {projectId:String} LIMIT 1`,
      query_params: { projectId },
    });

    const { data } = await result.json();

    return data.length > 0;
  }

  public async readMany(dto: {
    direction?: LogReadDirection;
    lastId?: string;
    startDate?: Date;
    endDate?: Date;
    level?: LogLevel;
    levels?: LogLevel[];
    limit: number;
    projectIds: string[];
    searchString?: string;
    namespaces?: string[];
  }): Promise<LogClickhouseNormalized[]> {
    if (dto.projectIds.length === 0) {
      return [];
    }

    const effectiveLevels = dto.levels?.length ? dto.levels : dto.level ? [dto.level] : null;
    const order = dto.direction === LogReadDirection.After ? 'ASC' : 'DESC';
    const conditions = ['l.project_id IN ({projectIds:Array(String)})'];
    const queryParams: Record<string, unknown> = {
      projectIds: dto.projectIds,
      limit: dto.limit,
    };

    if (dto.lastId && dto.direction) {
      conditions.push(`(l.created_at, l.sequence_number, l.id) ${order === 'ASC' ? '>' : '<'} (
        SELECT created_at, sequence_number, id
        FROM logs
        WHERE id = {lastId:String} AND project_id IN ({projectIds:Array(String)})
        LIMIT 1
      )`);
      queryParams.lastId = dto.lastId;
    }

    if (dto.startDate) {
      conditions.push('l.created_at >= {startDate:DateTime64(3)}');
      queryParams.startDate = ClickhouseUtils.jsDateToClickhouseDate(dto.startDate);
    }

    if (dto.endDate) {
      conditions.push('l.created_at <= {endDate:DateTime64(3)}');
      queryParams.endDate = ClickhouseUtils.jsDateToClickhouseDate(dto.endDate);
    }

    if (effectiveLevels) {
      conditions.push('l.level IN ({levels:Array(String)})');
      queryParams.levels = effectiveLevels;
    }

    if (dto.namespaces?.length) {
      conditions.push('l.namespace IN ({namespaces:Array(String)})');
      queryParams.namespaces = dto.namespaces;
    }

    const words =
      dto.searchString
        ?.trim()
        .split(/\s+/)
        .filter((word) => word.length > 0) ?? [];

    words.forEach((word, index) => {
      conditions.push(`positionCaseInsensitive(l.message, {searchWord${index}:String}) > 0`);
      queryParams[`searchWord${index}`] = word;
    });

    const result = await this.clickhouse.query({
      query: `
        SELECT l.* FROM logs l
        WHERE ${conditions.join(' AND ')}
        ORDER BY l.created_at ${order}, l.sequence_number ${order}, l.id ${order}
        LIMIT {limit:UInt32}
      `,
      query_params: queryParams,
    });
    const { data } = await result.json<LogClickhouseRow>();

    return data.map((row) => LogSerializer.normalizeClickhouse(row));
  }

  public async countByLevelsSince(dto: {
    projectId: string;
    levels: LogLevel[];
    since: Date;
  }): Promise<number> {
    const result = await this.clickhouse.query({
      query: `
        SELECT count() AS count
        FROM logs
        WHERE project_id = {projectId:String}
        AND level IN ({levels:Array(String)})
        AND created_at >= {since:DateTime64(3)}
      `,
      query_params: {
        projectId: dto.projectId,
        levels: dto.levels,
        since: ClickhouseUtils.jsDateToClickhouseDate(dto.since),
      },
    });

    const { data } = await result.json<{ count: string }>();

    return data.length > 0 ? Number(data[0].count) : 0;
  }

  public async getLastLogReceivedAt(projectId: string): Promise<Date | null> {
    const result = await this.clickhouse.query({
      query: `
        SELECT MAX(created_at) AS last_log_at
        FROM logs
        WHERE project_id = {projectId:String}
      `,
      query_params: { projectId },
    });

    const { data } = await result.json<{ last_log_at: string | null }>();

    if (data.length === 0 || !data[0].last_log_at) {
      return null;
    }

    // ClickHouse returns the zero date when there are no matching rows.
    if (data[0].last_log_at.startsWith('1970-01-01')) {
      return null;
    }

    return ClickhouseUtils.clickhouseDateToJsDate(data[0].last_log_at);
  }

  public async getUniqueNamespaces(projectIds: string[]): Promise<NamespaceMetadata[]> {
    if (projectIds.length === 0) {
      return [];
    }

    const result = await this.clickhouse.query({
      query: `
        SELECT 
          namespace, 
          MAX(created_at) as last_log_date 
        FROM logs 
        WHERE project_id IN ({projectIds:Array(String)}) AND namespace IS NOT NULL 
        GROUP BY namespace 
        ORDER BY last_log_date DESC
      `,
      query_params: { projectIds },
    });

    const { data } = await result.json<{ namespace: string; last_log_date: string }>();

    return data.map((row) => ({
      namespace: row.namespace,
      lastLogDate: ClickhouseUtils.clickhouseDateToJsDate(row.last_log_date).toISOString(),
    }));
  }
}
