import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { RecordMetricBody } from '../../src/metric/core/dto/record-metric.dto';
import { MetricQueueingService } from '../../src/metric/queueing/metric-queueing-service';

export class MetricUtils {
  constructor(private readonly app: INestApplication<App>) {}

  public async recordMetric(dto: RecordMetricBody & { apiKey: string }): Promise<void> {
    // The API body only carries the metric itself - `apiKey` travels in a header.
    // Sending it would be rejected by the global ValidationPipe
    // (`forbidNonWhitelisted`).
    const body: RecordMetricBody = {
      name: dto.name,
      value: dto.value,
      operation: dto.operation,
    };

    await request(this.app.getHttpServer())
      .put('/metrics')
      .set('project-api-key', dto.apiKey)
      .send(body);

    await this.app.get(MetricQueueingService).processQueue();
  }
}
