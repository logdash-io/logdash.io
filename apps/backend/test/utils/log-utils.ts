import { INestApplication } from '@nestjs/common';

import * as request from 'supertest';
import { CreateLogBody } from '../../src/log/core/dto/create-log.body';
import { sleep } from './sleep';

export class LogUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public async createLog(
    dto: CreateLogBody & { apiKey: string },
  ): Promise<void> {
    const response = await request(this.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', dto.apiKey)
      .send(dto);

    await sleep(1000);

    return response.body;
  }
}
