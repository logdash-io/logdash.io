import { createTestApp } from '../utils/bootstrap';
import { NewMetricQueueingService } from '../../src/metric/new-queueing/new-metric-queueing.service';
import { MetricOperation } from '@logdash/js-sdk';
import { MetricBufferService } from '../../src/metric/buffer/metric-buffer.service';
import { randomIntegerBetweenInclusive } from '../../src/shared/utils/random-integer-between';
import { groupBy } from '../../src/shared/utils/group-by';
import { getProjectPlanConfig } from '../../src/shared/configs/project-plan-configs';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';

describe('Metrics (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let queueingService: NewMetricQueueingService;
  let buffferService: MetricBufferService;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    queueingService = bootstrap.app.get(NewMetricQueueingService);
    buffferService = bootstrap.app.get(MetricBufferService);
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const freeTierLimit = getProjectPlanConfig(ProjectTier.Free).metrics.maxMetricsRegisterEntries;

  it(`it lets free user add ${freeTierLimit} metrics`, async () => {
    // given
    const uniqueMetricsNumberToTry = 3;
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    for (let i = 0; i < uniqueMetricsNumberToTry; i++) {
      try {
        await queueingService.queueMetric({
          projectId: setup.project.id,
          metricName: `metric-${i}`,
          operation: MetricOperation.Set,
          value: 2137,
        });
      } catch {}
    }

    await buffferService.flushBuffer();

    // then
    const metrics = await bootstrap.models.metricRegisterModel.find({
      projectId: setup.project.id,
    });

    expect(metrics.length).toBe(freeTierLimit);
    metrics.forEach((metric) => {
      expect(metric.values.counter?.absoluteValue).toBe(2137);
    });
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
