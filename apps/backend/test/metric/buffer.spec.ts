import { createTestApp } from '../utils/bootstrap';
import { NewMetricQueueingService } from '../../src/metric/new-queueing/new-metric-queueing.service';
import { MetricOperation } from '@logdash/js-sdk';
import { MetricBufferService } from '../../src/metric/buffer/metric-buffer.service';
import { randomIntegerBetweenInclusive } from '../../src/shared/utils/random-integer-between';
import { getProjectPlanConfig } from '../../src/shared/configs/project-plan-configs';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

describe('Metrics buffer', () => {
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

  const testCases = [
    {
      tier: UserTier.Free,
      limit: getProjectPlanConfig(ProjectTier.Free).metrics.maxMetricsRegisterEntries,
    },
    {
      tier: UserTier.EarlyBird,
      limit: getProjectPlanConfig(ProjectTier.EarlyBird).metrics.maxMetricsRegisterEntries,
    },
  ];

  testCases.forEach(({ tier, limit }) => {
    it(`lets ${tier} user add ${limit} metrics`, async () => {
      const uniqueMetricsNumberToTry = 500;
      const setup = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: tier as UserTier,
        email: 'test@test.com',
      });

      for (let i = 0; i < uniqueMetricsNumberToTry; i++) {
        try {
          await queueingService.queueMetric({
            projectId: setup.project.id,
            name: `metric-${i}`,
            operation: MetricOperation.Set,
            value: 2137,
          });
        } catch {}
      }

      await buffferService.flushBuffer();

      const metrics = await bootstrap.models.metricRegisterModel.find({
        projectId: setup.project.id,
      });

      expect(metrics.length).toBe(limit);
      metrics.forEach((metric) => {
        expect(metric.values.counter?.absoluteValue).toBe(2137);
      });
    });
  });

  it('accumulates mutate metrics', async () => {
    jest.retryTimes(5);
    // given
    const iterations = 2137;
    const setup = await bootstrap.utils.generalUtils.setupClaimed({
      userTier: UserTier.EarlyBird,
      email: 'test@test.com',
    });

    // when
    for (let i = 0; i < iterations; i++) {
      await queueingService.queueMetric({
        projectId: setup.project.id,
        name: `metric-${randomIntegerBetweenInclusive(0, 9)}`,
        operation: MetricOperation.Change,
        value: 1,
      });
    }

    await buffferService.flushBuffer();

    // then
    const metrics = await bootstrap.models.metricRegisterModel.find({
      projectId: setup.project.id,
    });

    expect(metrics.length).toBe(10);

    const metricsSum = metrics.reduce(
      (acc, metric) => acc + (metric.values.counter?.absoluteValue ?? 0),
      0,
    );

    expect(metricsSum).toBe(iterations);
  });

  it('accumulates set and change metrics', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupClaimed({
      userTier: UserTier.EarlyBird,
      email: 'test@test.com',
    });

    // when
    await queueingService.queueMetric({
      projectId: setup.project.id,
      name: `metric`,
      operation: MetricOperation.Set,
      value: 2137,
    });

    await queueingService.queueMetric({
      projectId: setup.project.id,
      name: `metric`,
      operation: MetricOperation.Change,
      value: 1,
    });

    await buffferService.flushBuffer();

    // then
    const metrics = await bootstrap.models.metricRegisterModel.find({
      projectId: setup.project.id,
    });

    expect(metrics.length).toBe(1);
    expect(metrics[0].values.counter?.absoluteValue).toBe(2138);
  });
});
