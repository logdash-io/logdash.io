import { INestApplication } from '@nestjs/common';

import * as request from 'supertest';
import { CreateLogBody } from '../../src/log/core/dto/create-log.body';
import { sleep } from './sleep';
import { ClickHouseClient } from '@clickhouse/client';
import { LogSerializer } from '../../src/log/core/entities/log.serializer';
import { LogNormalized } from '../../src/log/core/entities/log.interface';

export class LogUtils {
  private readonly clickhouseClient: ClickHouseClient;

  constructor(private readonly app: INestApplication<any>) {
    this.clickhouseClient = app.get(ClickHouseClient);
  }

  public async createLog(
    dto: CreateLogBody & { apiKey: string; withoutSleep?: boolean },
  ): Promise<void> {
    const response = await request(this.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', dto.apiKey)
      .send(dto);

    if (dto.withoutSleep === undefined || dto.withoutSleep === false) {
      await sleep(1000);
    }

    return response.body;
  }

  public async readLogs(projectId: string): Promise<LogNormalized[]> {
    const result = await this.clickhouseClient.query({
      query: `SELECT * FROM logs WHERE project_id = '${projectId}'`,
    });

    const data = ((await result.json()) as any).data;

    return data.map((row: any) => LogSerializer.normalizeClickhouse(row));
  }
}
