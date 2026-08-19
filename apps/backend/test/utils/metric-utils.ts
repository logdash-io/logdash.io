import { INestApplication } from '@nestjs/common';

import * as request from 'supertest';
import { RecordMetricBody } from '../../src/metric/core/dto/record-metric.dto';
import { sleep } from './sleep';

export class MetricUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public async recordMetric(
    dto: RecordMetricBody & { apiKey: string; withoutSleep?: boolean },
  ): Promise<void> {
    // The API body only carries the metric itself - `apiKey` travels in a header
    // and `withoutSleep` is test-only. Sending them would be rejected by the
    // global ValidationPipe (`forbidNonWhitelisted`).
    const body: RecordMetricBody = {
      name: dto.name,
      value: dto.value,
      operation: dto.operation,
    };

    const response = await request(this.app.getHttpServer())
      .put('/metrics')
      .set('project-api-key', dto.apiKey)
      .send(body);

    if (!dto.withoutSleep) {
      await sleep(1500);
    }

    return response.body;
  }
}
