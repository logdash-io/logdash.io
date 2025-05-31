import { createClient, type ClickHouseClient } from '@clickhouse/client';
import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { getOurEnv, OurEnv } from '../../shared/types/our-env.enum';
import { sleep } from '../../shared/utils/sleep';
import { LogNormalized } from '../core/entities/log.interface';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class LogWriteClickhouseService {
  private readonly clickhouse: ClickHouseClient;

  constructor(private readonly logger: Logger) {
    const clickHouseConfig = getEnvConfig().clickhouse;
    this.clickhouse = createClient({ ...clickHouseConfig });
  }

  public async create(dto: CreateLogDto): Promise<LogNormalized> {
    console.log('create single');
    const logData = {
      id: dto.id,
      createdAt: dto.createdAt.toISOString().replace('Z', ''),
      message: dto.message,
      level: dto.level,
      projectId: dto.projectId,
      index: dto.index || 0,
    };

    await this.clickhouse.insert({
      table: 'logs',
      values: [logData],
      format: 'JSONEachRow',
    });

    return {
      id: dto.id,
      createdAt: dto.createdAt,
      message: dto.message,
      level: dto.level,
      projectId: dto.projectId,
      index: dto.index || 0,
    };
  }

  public async createMany(dtos: CreateLogDto[]): Promise<void> {
    if (dtos.length === 0) return;

    const logData = dtos.map((dto) => ({
      id: dto.id,
      createdAt: dto.createdAt.toISOString().replace('Z', ''),
      message: dto.message,
      level: dto.level,
      projectId: dto.projectId,
      index: dto.index || 0,
    }));

    await this.clickhouse.insert({
      table: 'logs',
      values: logData,
      format: 'JSONEachRow',
    });
  }

  public async removeForProjectWithIndexLessThan(projectId: string, index: number): Promise<void> {
    await this.clickhouse.command({
      query: `
        DELETE FROM logs 
        WHERE projectId = {projectId:String} 
        AND index < {index:UInt32}
      `,
      query_params: {
        projectId,
        index,
      },
    });
  }

  public async deleteBelongingToProject(projectId: string): Promise<void> {
    await this.clickhouse.command({
      query: `
        DELETE FROM logs 
        WHERE projectId = {projectId:String}
      `,
      query_params: {
        projectId,
      },
    });
  }

  @Cron(CronExpression.EVERY_SECOND)
  public async simulateOneSecondTraffic(): Promise<void> {
    if (process.env.NODE_ENV === 'test' || getOurEnv() === OurEnv.Prod) {
      return;
    }

    const logsPerSecond = 1;
    const intervalBetweenLogs = 1000 / logsPerSecond;

    for (let i = 0; i < logsPerSecond; i++) {
      this.logger.log('Stress test log');
      await sleep(intervalBetweenLogs);
    }
  }
}
