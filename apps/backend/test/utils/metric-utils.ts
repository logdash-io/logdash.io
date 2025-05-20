import { INestApplication } from '@nestjs/common';

import * as request from 'supertest';
import { RecordMetricBody } from '../../src/metric/core/dto/record-metric.dto';
import { sleep } from './sleep';

export class MetricUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public async recordMetric(
    dto: RecordMetricBody & { apiKey: string; withoutSleep?: boolean },
  ): Promise<void> {
    const response = await request(this.app.getHttpServer())
      .put('/metrics')
      .set('project-api-key', dto.apiKey)
      .send(dto);

    if (!dto.withoutSleep) {
      await sleep(1500);
    }

    return response.body;
  }
}
