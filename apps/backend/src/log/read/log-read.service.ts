import { Injectable } from '@nestjs/common';
import { LogNormalized } from '../core/entities/log.interface';
import { LogSerializer } from '../core/entities/log.serializer';
import { LogReadDirection } from '../core/enums/log-read-direction.enum';
import { ClickHouseClient } from '@clickhouse/client';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { LogLevel } from '../core/enums/log-level.enum';
import { NamespaceMetadata } from './dto/namespace-metadata.dto';

@Injectable()
export class LogReadService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async existsForProject(projectId: string): Promise<boolean> {
    const result = await this.clickhouse.query({
      query: `SELECT 1 FROM logs WHERE project_id = '${projectId}' LIMIT 1`,
    });

    const data = ((await result.json()) as any).data;

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
    projectId: string;
    searchString?: string;
    namespaces?: string[];
  }): Promise<LogNormalized[]> {
    let query: string;
    let queryParams: Record<string, any>;

    const effectiveLevels = dto.levels?.length ? dto.levels : dto.level ? [dto.level] : null;

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
      }

      queryParams = {
        projectId: dto.projectId,
        lastId: dto.lastId,
        limit: dto.limit,
      };

      if (dto.startDate) {
        query += ` AND l.created_at >= {startDate:DateTime64(3)}`;
        queryParams.startDate = ClickhouseUtils.jsDateToClickhouseDate(dto.startDate);
      }

      if (dto.endDate) {
        query += ` AND l.created_at <= {endDate:DateTime64(3)}`;
        queryParams.endDate = ClickhouseUtils.jsDateToClickhouseDate(dto.endDate);
      }

      if (effectiveLevels) {
        query += ` AND l.level IN ({levels:Array(String)})`;
        queryParams.levels = effectiveLevels;
      }

      if (dto.namespaces?.length) {
        query += ` AND l.namespace IN ({namespaces:Array(String)})`;
        queryParams.namespaces = dto.namespaces;
      }

      if (dto.searchString && dto.searchString.trim()) {
        const words = dto.searchString
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0);
        words.forEach((word, index) => {
          query += ` AND positionCaseInsensitive(l.message, {searchWord${index}:String}) > 0`;
          queryParams[`searchWord${index}`] = word;
        });
      }

      if (dto.direction === LogReadDirection.After) {
        query += ` ORDER BY l.created_at ASC, l.sequence_number ASC LIMIT {limit:UInt32}`;
      } else {
        query += ` ORDER BY l.created_at DESC, l.sequence_number DESC LIMIT {limit:UInt32}`;
      }
    } else {
      query = `SELECT * FROM logs WHERE project_id = {projectId:String}`;
      queryParams = {
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

      if (effectiveLevels) {
        query += ` AND level IN ({levels:Array(String)})`;
        queryParams.levels = effectiveLevels;
      }

      if (dto.namespaces?.length) {
        query += ` AND namespace IN ({namespaces:Array(String)})`;
        queryParams.namespaces = dto.namespaces;
      }

      if (dto.searchString && dto.searchString.trim()) {
        const words = dto.searchString
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0);
        words.forEach((word, index) => {
          query += ` AND positionCaseInsensitive(message, {searchWord${index}:String}) > 0`;
          queryParams[`searchWord${index}`] = word;
        });
      }

      query += ` ORDER BY created_at DESC, sequence_number DESC LIMIT {limit:UInt32}`;
    }

    const result = await this.clickhouse.query({
      query,
      query_params: queryParams,
    });
    const data = ((await result.json()) as any).data;

    return data.map((row: any) => LogSerializer.normalizeClickhouse(row));
  }

  public async getUniqueNamespaces(projectId: string): Promise<NamespaceMetadata[]> {
    const result = await this.clickhouse.query({
      query: `
        SELECT 
          namespace, 
          MAX(created_at) as last_log_date 
        FROM logs 
        WHERE project_id = {projectId:String} AND namespace IS NOT NULL 
        GROUP BY namespace 
        ORDER BY last_log_date DESC
      `,
      query_params: { projectId },
    });

    const data = ((await result.json()) as any).data;

    return data.map((row: any) => ({
      namespace: row.namespace,
      lastLogDate: ClickhouseUtils.clickhouseDateToJsDate(row.last_log_date).toISOString(),
    }));
  }
}
