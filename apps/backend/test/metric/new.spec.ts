import { createTestApp } from '../utils/bootstrap';
import { NewMetricQueueingService } from '../../src/metric/new-queueing/new-metric-queueing.service';
import { MetricOperation } from '@logdash/js-sdk';
import { MetricBufferService } from '../../src/metric/buffer/metric-buffer.service';
import { randomIntegerBetweenInclusive } from '../../src/shared/utils/random-integer-between';
import { groupBy } from '../../src/shared/utils/group-by';

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

    const iterations = 100_000;
    const numberOfProjects = 100;
    const limit = 5;

    const start = performance.now();

    await Promise.all(
      Array.from({ length: iterations }, async (_, i) => {
        try {
          const projectId = `default${randomIntegerBetweenInclusive(0, numberOfProjects - 1)}`;

          await newMetricQueueingService.queueMetric({
            projectId,
            metricName: `metric-${i}`,
            operation: MetricOperation.Change,
            value: 1,
          });
          await newMetricQueueingService.queueMetric({
            projectId,
            metricName: `metric-${i}`,
            operation: MetricOperation.Change,
            value: 1,
          });
          await newMetricQueueingService.queueMetric({
            projectId,
            metricName: `metric-${i}`,
            operation: MetricOperation.Change,
            value: 1,
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

    const metrics = await bootstrap.models.metricRegisterModel.find();

    const grouped = groupBy(metrics, 'projectId');

    expect(Object.keys(grouped).length).toBe(numberOfProjects);

    for (const projectId of Object.keys(grouped)) {
      expect(grouped[projectId].length).toBe(limit);

      for (const metric of grouped[projectId]) {
        expect(metric.values.counter?.absoluteValue).toBe(3);
      }
    }
  }, 20_000);
});
