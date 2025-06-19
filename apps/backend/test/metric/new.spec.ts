import { createTestApp } from '../utils/bootstrap';
import { MetricRegisterRedisService } from '../../src/metric-register/redis/metric-register-redis.service';
import { NewMetricQueueingService } from '../../src/metric/new-queueing/new-metric-queueing.service';
import { MetricOperation } from '@logdash/js-sdk';
import { MetricBufferService } from '../../src/metric/buffer/metric-buffer.service';

describe('Metrics (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  it('test', async () => {
    const newMetricQueueingService = bootstrap.app.get(NewMetricQueueingService);

    const iterations = 10_000;
    const limit = 5;
    const projectId = 'default';

    const start = performance.now();

    await Promise.all(
      Array.from({ length: iterations }, async (_, i) => {
        try {
          await newMetricQueueingService.queueMetric({
            projectId: `default${Math.random()}`,
            metricName: `metric-${i}`,
            operation: MetricOperation.Set,
            value: i,
          });
        } catch {}
      }),
    );

    const end = performance.now();

    const bufferService = bootstrap.app.get(MetricBufferService);
    await bufferService.flushBuffer();

    const end2 = performance.now();

    console.log(`Time it took to queue: ${end - start}ms`);
    console.log(`Time it took to flush buffer: ${end2 - end}ms`);
  }, 20_000);
});
