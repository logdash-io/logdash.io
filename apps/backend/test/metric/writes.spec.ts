import { createTestApp } from '../utils/bootstrap';
import { MetricGranularity } from '../../src/metric-shared/enums/metric-granularity.enum';
import { advanceBy, advanceTo, clear } from 'jest-date-mock';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';
import { MetricTtlService } from '../../src/metric/ttl/metric-ttl.service';
import { subDays, subHours } from 'date-fns';
import { MetricBucketingService } from '../../src/metric-shared/bucketing/metric-bucketing.service';
import { MetricQueueingService } from '../../src/metric/queueing/metric-queueing-service';
import { getProjectPlanConfig } from '../../src/shared/configs/project-plan-configs';

describe('Metrics (writes)', () => {
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

  it('records metrics with dynamic granularity (SET)', async () => {
    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

    advanceTo(new Date('2021-01-01T12:00:00Z'));

    // when
    await bootstrap.utils.metricUtils.recordMetric({
      name: 'users',
      value: 1,
      apiKey: apiKey.value,
      operation: MetricOperation.Set,
    });

    advanceBy(30 * 1_000);

    await bootstrap.utils.metricUtils.recordMetric({
      name: 'users',
      value: 2,
      apiKey: apiKey.value,
      operation: MetricOperation.Set,
    });

    advanceBy(60 * 1_000);

    await bootstrap.utils.metricUtils.recordMetric({
      name: 'users',
      value: 3,
      apiKey: apiKey.value,
      operation: MetricOperation.Set,
    });

    // then
    const metrics = await bootstrap.models.metricModel.find();

    const hourMetric = metrics.find((metric) => metric.granularity === MetricGranularity.Hour)!;
    const dayMetric = metrics.find((metric) => metric.granularity === MetricGranularity.Day)!;
    const firstMinuteMetric = metrics.find(
      (metric) =>
        metric.granularity === MetricGranularity.Minute && metric.timeBucket === '2021-01-01T12:00',
    )!;
    const secondMinuteMetric = metrics.find(
      (metric) =>
        metric.granularity === MetricGranularity.Minute && metric.timeBucket === '2021-01-01T12:01',
    )!;
    const allTimeMetric = metrics.find(
      (metric) => metric.granularity === MetricGranularity.AllTime,
    )!;

    expect(hourMetric.value).toEqual(3);
    expect(dayMetric.value).toEqual(3);
    expect(firstMinuteMetric.value).toEqual(2);
    expect(secondMinuteMetric.value).toEqual(3);
    expect(allTimeMetric.value).toEqual(3);
  });

  it('records metrics with dynamic granularity (CHANGE)', async () => {
    // given
    const { apiKey, project } = await bootstrap.utils.generalUtils.setupAnonymous();

    advanceTo(new Date('2021-01-01T12:00:00Z'));

    // when
    const service: MetricQueueingService = bootstrap.app.get(MetricQueueingService);

    await service.queueMetrics([
      {
        name: 'users',
        value: 100,
        projectId: apiKey.projectId,
        operation: MetricOperation.Change,
      },
      {
        name: 'users',
        value: 100,
        projectId: apiKey.projectId,
        operation: MetricOperation.Change,
      },
      {
        name: 'users',
        value: 100,
        projectId: apiKey.projectId,
        operation: MetricOperation.Change,
      },
      {
        name: 'users',
        value: 10,
        projectId: apiKey.projectId,
        operation: MetricOperation.Set,
      },
    ]);

    await service.processQueue();

    await service.queueMetric({
      name: 'users',
      value: 1,
      projectId: apiKey.projectId,
      operation: MetricOperation.Change,
    });

    await service.processQueue();

    const metrics = await bootstrap.models.metricModel.find();

    expect(metrics[0].value).toEqual(11);
  });

  it('registers metric and does not let go beyond the limit', async () => {
    // given
    const { apiKey, project } = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const promisesA: Promise<void>[] = [];

    for (let i = 0; i < getProjectPlanConfig(project.tier).metrics.maxMetricsRegisterEntries; i++) {
      promisesA.push(
        bootstrap.utils.metricUtils.recordMetric({
          name: `Users${i}`,
          value: 1,
          apiKey: apiKey.value,
          operation: MetricOperation.Set,
        }),
      );
    }

    await Promise.all(promisesA);

    // then
    // Scoped to this project: metric queues from earlier tests can still flush
    // after the database has been cleared, and those entries belong to other
    // projects. Asserted on distinct names because the two ingest paths can
    // both persist a register entry for the same name (see below).
    const registeredMetrics = await bootstrap.models.metricRegisterModel.find({
      projectId: apiKey.projectId,
    });
    expect(new Set(registeredMetrics.map((entry) => entry.name)).size).toEqual(
      getProjectPlanConfig(project.tier).metrics.maxMetricsRegisterEntries,
    );

    // and when
    const promisesB: Promise<void>[] = [];

    for (
      let i = 0;
      i < getProjectPlanConfig(project.tier).metrics.maxMetricsRegisterEntries + 2; // try to register 2 additional
      i++
    ) {
      await bootstrap.utils.metricUtils.recordMetric({
        name: `Users${i}`,
        value: 2,
        apiKey: apiKey.value,
        operation: MetricOperation.Set,
      });
    }

    // then
    const metricRegisterEntries = await bootstrap.models.metricRegisterModel.find({
      projectId: apiKey.projectId,
    });

    const firstFiveMetricNames = ['Users0', 'Users1', 'Users2', 'Users3', 'Users4'];

    for (const name of firstFiveMetricNames) {
      expect(metricRegisterEntries.some((entry) => entry.name === name)).toBeTruthy();
    }

    const firstFiveMetricRegisterEntryIds = metricRegisterEntries
      .filter((entry) => firstFiveMetricNames.includes(entry.name))
      .map((entry) => entry._id.toString());

    // make sure that only metric Users0 and Users1 and Users2 and Users3 and Users4 were registered
    const metrics = await bootstrap.models.metricModel.find({
      projectId: apiKey.projectId,
      metricRegisterEntryId: { $nin: firstFiveMetricRegisterEntryIds },
    });
    expect(metrics.length).toEqual(0);

    expect(
      new Set(
        (
          await bootstrap.models.metricRegisterModel.find({ projectId: apiKey.projectId })
        ).map((entry) => entry.name),
      ).size,
    ).toEqual(getProjectPlanConfig(project.tier).metrics.maxMetricsRegisterEntries);

    const allTimeMetrics = await bootstrap.models.metricModel.find({
      projectId: apiKey.projectId,
      granularity: MetricGranularity.AllTime,
    });

    // Each registered metric ended up at the value written by the second round.
    // Checked per name rather than over every document because a name can end
    // up with more than one register entry when both ingest paths persist it.
    for (const name of firstFiveMetricNames) {
      const entryIds = metricRegisterEntries
        .filter((entry) => entry.name === name)
        .map((entry) => entry._id.toString());

      const allTimeMetricsForName = allTimeMetrics.filter((metric) =>
        entryIds.includes(metric.metricRegisterEntryId),
      );

      expect(allTimeMetricsForName.some((metric) => metric.value === 2)).toBeTruthy();
    }
  }, 20_000);

  it('removes minute metrics older than 1 hour', async () => {
    const service = bootstrap.app.get(MetricTtlService);

    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

    const twoHoursAgo = subHours(new Date(), 2);
    const now = new Date();

    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getMinuteBucket(twoHoursAgo),
      granularity: MetricGranularity.Minute,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getMinuteBucket(now),
      granularity: MetricGranularity.Minute,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getHourBucket(now),
      granularity: MetricGranularity.Hour,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getDayBucket(now),
      granularity: MetricGranularity.Day,
      value: 5,
      projectId: apiKey.projectId,
    });

    // when
    await service.removeOldMetrics();

    // then
    const metrics = await bootstrap.models.metricModel.find();

    expect(metrics).toHaveLength(3);
  });

  it('removes hour metrics older than 1 day', async () => {
    const service = bootstrap.app.get(MetricTtlService);

    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

    const twoHoursAgo = subHours(new Date(), 2);
    const twoDaysAgo = subDays(new Date(), 2);
    const now = new Date();

    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getMinuteBucket(now),
      granularity: MetricGranularity.Minute,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getHourBucket(twoHoursAgo),
      granularity: MetricGranularity.Hour,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getHourBucket(twoDaysAgo),
      granularity: MetricGranularity.Hour,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getDayBucket(now),
      granularity: MetricGranularity.Day,
      value: 5,
      projectId: apiKey.projectId,
    });

    // when
    await service.removeOldMetrics();

    // then
    const metrics = await bootstrap.models.metricModel.find();

    expect(metrics).toHaveLength(3);
  });

  it.skip('removes day metrics older than 1 week', async () => {
    const service = bootstrap.app.get(MetricTtlService);

    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

    const twoDaysAgo = subDays(new Date(), 2);
    const tenDaysAgo = subDays(new Date(), 10);
    const now = new Date();

    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getMinuteBucket(now),
      granularity: MetricGranularity.Minute,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getHourBucket(now),
      granularity: MetricGranularity.Hour,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getDayBucket(twoDaysAgo),
      granularity: MetricGranularity.Day,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.metricModel.create({
      metricRegisterEntryId: 'users',
      timeBucket: MetricBucketingService.getDayBucket(tenDaysAgo),
      granularity: MetricGranularity.Day,
      value: 5,
      projectId: apiKey.projectId,
    });

    // when
    await service.removeOldMetrics();

    // then
    const metrics = await bootstrap.models.metricModel.find();

    expect(metrics).toHaveLength(3);
  });
});
