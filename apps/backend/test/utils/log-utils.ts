import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';

import * as request from 'supertest';
import { CreateLogBody } from '../../src/log/core/dto/create-log.body';
import { LogQueueingService } from '../../src/log/queueing/log-queueing.service';
import { ClickHouseClient } from '@clickhouse/client';
import { LogSerializer } from '../../src/log/core/entities/log.serializer';
import { LogClickhouseNormalized } from '../../src/log/core/entities/log.interface';
import { LogClickhouseRow } from '../../src/log/core/entities/log.clickhouse-entity';

export class LogUtils {
  private readonly clickhouseClient: ClickHouseClient;

  constructor(private readonly app: INestApplication<App>) {
    this.clickhouseClient = app.get(ClickHouseClient);
  }

  public async createLog(dto: CreateLogBody & { apiKey: string }): Promise<void> {
    // The API body only carries the log itself - `apiKey` travels in a header.
    // Sending it would be rejected by the global ValidationPipe
    // (`forbidNonWhitelisted`).
    const body: CreateLogBody = {
      createdAt: dto.createdAt,
      message: dto.message,
      level: dto.level,
      sequenceNumber: dto.sequenceNumber,
      namespace: dto.namespace,
    };

    await request(this.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', dto.apiKey)
      .send(body);

    await this.app.get(LogQueueingService).processQueue();
  }

  public async readLogs(projectId: string): Promise<LogClickhouseNormalized[]> {
    const result = await this.clickhouseClient.query({
      query: `SELECT * FROM logs WHERE project_id = '${projectId}'`,
    });

    const { data } = await result.json<LogClickhouseRow>();

    return data.map((row) => LogSerializer.normalizeClickhouse(row));
  }
}
