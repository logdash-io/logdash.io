import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { closeInMemoryMongoServer } from '../utils/mongo-in-memory-server';
import { MetricGranularity } from '../../src/metric-shared/enums/metric-granularity.enum';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { parseFlexibleDate } from '../../src/shared/utils/parse-flexible-date';
import { LogMetricsResponse } from '../../src/log-metric/core/dto/log-metrics.response';
import { MetricBucketingService } from '../../src/metric-shared/bucketing/metric-bucketing.service';

describe('Log metrics (reads)', () => {
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
  it('returns log metric belonging only to requested project', async () => {
    // given
    const dateBucketA = '2021-01-01T12:00:00Z';
    const dateBucketB = '2021-01-01T12:05:00Z';

    const { user, project, token } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    const metricInThisProject = await bootstrap.models.logMetricModel.create({
      granularity: MetricGranularity.Minute,
      timeBucket: dateBucketA,
      projectId: project.id,
      values: {
        [LogLevel.Info]: 1,
      },
    });

    const otherMetric = await bootstrap.models.logMetricModel.create({
      granularity: MetricGranularity.Minute,
      timeBucket: dateBucketB,
      projectId: 'some-other-project-id',
      values: {
        [LogLevel.Info]: 1,
      },
    });

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(
        `/projects/${project.id}/log_metrics?granularities=${MetricGranularity.Minute}`,
      )
      .set('Authorization', `Bearer ${token}`);

    const body = response.body as LogMetricsResponse;

    // then
    expect(body.minute[0].date).toEqual(
      parseFlexibleDate(metricInThisProject.timeBucket).toISOString(),
    );
    expect(body.minute[0].values).toEqual(metricInThisProject.values);
  });

  it('respects requested granularities', async () => {
    // given
    const dateBucketA = '2021-01-01T12:00';
    const dateBucketB = '2021-01-01T12';

    const { user, project, token } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    const metricA = await bootstrap.models.logMetricModel.create({
      granularity: MetricGranularity.Minute,
      timeBucket: dateBucketA,
      projectId: project.id,
      values: {
        [LogLevel.Info]: 1,
      },
    });

    const metricB = await bootstrap.models.logMetricModel.create({
      granularity: MetricGranularity.Hour,
      timeBucket: dateBucketB,
      projectId: project.id,
      values: {
        [LogLevel.Info]: 1,
      },
    });

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(
        `/projects/${project.id}/log_metrics?granularities=${MetricGranularity.Day}`,
      )
      .set('Authorization', `Bearer ${token}`);

    const body = response.body as LogMetricsResponse;

    // then
    expect(body.minute).toHaveLength(0);
    expect(body.hour).toHaveLength(0);
  });

  it('respects time range', async () => {
    // given
    const dateA = new Date('2021-01-01T12:00:00Z');
    const dateB = new Date('2021-01-01T12:05:00Z');

    const { project, token } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    const metricAMinute = await bootstrap.models.logMetricModel.create({
      granularity: MetricGranularity.Minute,
      timeBucket: MetricBucketingService.getMinuteBucket(dateA),
      projectId: project.id,
      values: {
        [LogLevel.Info]: 1,
      },
    });

    const metricAHour = await bootstrap.models.logMetricModel.create({
      granularity: MetricGranularity.Hour,
      timeBucket: MetricBucketingService.getHourBucket(dateA),
      projectId: project.id,
      values: {
        [LogLevel.Info]: 2,
      },
    });

    const metricADay = await bootstrap.models.logMetricModel.create({
      granularity: MetricGranularity.Day,
      timeBucket: MetricBucketingService.getDayBucket(dateA),
      projectId: project.id,
      values: {
        [LogLevel.Info]: 2,
      },
    });

    const metricBMinute = await bootstrap.models.logMetricModel.create({
      granularity: MetricGranularity.Minute,
      timeBucket: MetricBucketingService.getMinuteBucket(dateB),
      projectId: project.id,
      values: {
        [LogLevel.Info]: 1,
      },
    });

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(
        `/projects/${project.id}/log_metrics?&after=2021-01-01T12:04:00Z&before=2021-01-01T12:06:00Z`,
      )
      .set('Authorization', `Bearer ${token}`);

    const body = response.body as LogMetricsResponse;

    // then
    expect(body.day).toHaveLength(1);
    expect(body.hour).toHaveLength(1);
    expect(body.minute).toHaveLength(1);
  });

  it('throws error if user does not belong to project', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

    const response = await request(bootstrap.app.getHttpServer())
      .get(`/projects/${setupA.project.id}/log_metrics`)
      .set('Authorization', `Bearer ${setupB.token}`);

    expect(response.status).toEqual(403);
    expect(response.body.message).toEqual(
      'User is not a member of this cluster',
    );
  });
});
