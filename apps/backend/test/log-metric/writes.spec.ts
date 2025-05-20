import { createTestApp } from '../utils/bootstrap';
import { closeInMemoryMongoServer } from '../utils/mongo-in-memory-server';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { MetricGranularity } from '../../src/metric-shared/enums/metric-granularity.enum';
import { subDays, subHours } from 'date-fns';
import { LogMetricTtlService } from '../../src/log-metric/ttl/log-metric-ttl.service';
import { MetricBucketingService } from '../../src/metric-shared/bucketing/metric-bucketing.service';

describe('Log metrics (writes)', () => {
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

  it('records log metrics with dynamic granularity', async () => {
    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

    const dateA = new Date('2021-01-01T12:00:00Z');
    const dateB = new Date('2021-01-01T12:00:30Z');
    const dateC = new Date('2021-01-01T12:01:30Z');

    // when
    const [logA, logB, logC] = await Promise.all([
      bootstrap.utils.logUtils.createLog({
        createdAt: dateA.toISOString(),
        level: LogLevel.Info,
        message: 'some message A',
        apiKey: apiKey.value,
      }),
      bootstrap.utils.logUtils.createLog({
        createdAt: dateB.toISOString(),
        level: LogLevel.Info,
        message: 'some message B',
        apiKey: apiKey.value,
      }),
      bootstrap.utils.logUtils.createLog({
        createdAt: dateC.toISOString(),
        level: LogLevel.Info,
        message: 'some message C',
        apiKey: apiKey.value,
      }),
    ]);

    // then
    const logMetrics = await bootstrap.models.logMetricModel.find();

    const hourMetric = logMetrics.find(
      (metric) => metric.granularity === MetricGranularity.Hour,
    )!;
    const dayMetric = logMetrics.find(
      (metric) => metric.granularity === MetricGranularity.Day,
    )!;
    const firstMinuteMetric = logMetrics.find(
      (metric) =>
        metric.granularity === MetricGranularity.Minute &&
        metric.timeBucket === '2021-01-01T12:00',
    )!;
    const secondMinuteMetric = logMetrics.find(
      (metric) =>
        metric.granularity === MetricGranularity.Minute &&
        metric.timeBucket === '2021-01-01T12:01',
    )!;
    const allTimeMetric = logMetrics.find(
      (metric) => metric.granularity === MetricGranularity.AllTime,
    )!;

    expect(hourMetric.values.info).toEqual(3);
    expect(dayMetric.values.info).toEqual(3);
    expect(firstMinuteMetric.values.info).toEqual(2);
    expect(secondMinuteMetric.values.info).toEqual(1);
    expect(allTimeMetric.values.info).toEqual(3);
  });

  it('removes minute logs older than 1 hour', async () => {
    const service = bootstrap.app.get(LogMetricTtlService);

    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

    const twoHoursAgo = subHours(new Date(), 2);
    const now = new Date();

    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getMinuteBucket(twoHoursAgo),
      granularity: MetricGranularity.Minute,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getMinuteBucket(now),
      granularity: MetricGranularity.Minute,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getHourBucket(now),
      granularity: MetricGranularity.Hour,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getDayBucket(now),
      granularity: MetricGranularity.Day,
      value: 5,
      projectId: apiKey.projectId,
    });

    // when
    await service.removeOldLogMetrics();

    // then
    const logMetrics = await bootstrap.models.logMetricModel.find();

    expect(logMetrics).toHaveLength(3);
  });

  it('removes hour logs older than 1 day', async () => {
    const service = bootstrap.app.get(LogMetricTtlService);

    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

    const twoHoursAgo = subHours(new Date(), 2);
    const twoDaysAgo = subDays(new Date(), 2);
    const now = new Date();

    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getMinuteBucket(now),
      granularity: MetricGranularity.Minute,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getHourBucket(twoHoursAgo),
      granularity: MetricGranularity.Hour,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getHourBucket(twoDaysAgo),
      granularity: MetricGranularity.Hour,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getDayBucket(now),
      granularity: MetricGranularity.Day,
      value: 5,
      projectId: apiKey.projectId,
    });

    // when
    await service.removeOldLogMetrics();

    // then
    const logMetrics = await bootstrap.models.logMetricModel.find();

    expect(logMetrics).toHaveLength(3);
  });

  it('removes day logs older than 1 week', async () => {
    const service = bootstrap.app.get(LogMetricTtlService);

    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

    const twoDaysAgo = subDays(new Date(), 2);
    const tenDaysAgo = subDays(new Date(), 10);
    const now = new Date();

    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getMinuteBucket(now),
      granularity: MetricGranularity.Minute,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getHourBucket(now),
      granularity: MetricGranularity.Hour,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getDayBucket(twoDaysAgo),
      granularity: MetricGranularity.Day,
      value: 5,
      projectId: apiKey.projectId,
    });
    await bootstrap.models.logMetricModel.create({
      timeBucket: MetricBucketingService.getDayBucket(tenDaysAgo),
      granularity: MetricGranularity.Day,
      value: 5,
      projectId: apiKey.projectId,
    });

    // when
    await service.removeOldLogMetrics();

    // then
    const logMetrics = await bootstrap.models.logMetricModel.find();

    expect(logMetrics).toHaveLength(3);
  });
});
