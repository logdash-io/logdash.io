import { advanceTo } from 'jest-date-mock';
import { Types } from 'mongoose';
import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';

describe('Http Ping Bucket(reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    advanceTo(new Date('2025-05-10T12:30:00.000Z'));
    await bootstrap.methods.clearDatabase();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('GET /projects/:projectId/monitors/:monitorId/http_ping_buckets', () => {
    it('forbids access when user is not in cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setupA.project.id}/monitors/${new Types.ObjectId()}/http_ping_buckets`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toBe(403);
    });

    it('is not found for non existent monitor', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/monitors/${new Types.ObjectId()}/http_ping_buckets`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      expect(response.status).toBe(404);
    });

    it('gets hourly buckets for 24h period', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      twoDaysAgo.setMinutes(0, 0, 0);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      twoHoursAgo.setMinutes(0, 0, 0);
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      oneHourAgo.setMinutes(0, 0, 0);
      const twoHoursAgoBucket = {
        httpMonitorId: monitor.id,
        timestamp: twoHoursAgo,
        successCount: 3,
        failureCount: 4,
        averageLatencyMs: 200,
      };
      const oneHourAgoBucket = {
        httpMonitorId: monitor.id,
        timestamp: oneHourAgo,
        successCount: 5,
        failureCount: 6,
        averageLatencyMs: 300,
      };

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: monitor.id,
        timestamp: twoDaysAgo,
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
      });
      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket(twoHoursAgoBucket);
      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket(oneHourAgoBucket);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/monitors/${monitor.id}/http_ping_buckets?period=24h`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(24);

      const expectedOneHourAgoBucket = response.body[1];
      expect(expectedOneHourAgoBucket).toMatchObject({
        successCount: oneHourAgoBucket.successCount,
        failureCount: oneHourAgoBucket.failureCount,
        averageLatencyMs: oneHourAgoBucket.averageLatencyMs,
        timestamp: oneHourAgo.toISOString(),
      });

      const expectedTwoHoursAgoBucket = response.body[2];
      expect(expectedTwoHoursAgoBucket).toMatchObject({
        successCount: twoHoursAgoBucket.successCount,
        failureCount: twoHoursAgoBucket.failureCount,
        averageLatencyMs: twoHoursAgoBucket.averageLatencyMs,
        timestamp: twoHoursAgo.toISOString(),
      });

      const nullBuckets = response.body.filter((bucket) => bucket === null);
      expect(nullBuckets).toHaveLength(22);
    });

    it('gets virtual bucket for current hour', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });
      const currentHour = new Date();
      currentHour.setMinutes(0, 0, 0);
      await bootstrap.utils.httpPingUtils.createHttpPing({ httpMonitorId: monitor.id });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/monitors/${monitor.id}/http_ping_buckets?period=24h`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(24);
      expect(response.body[0]).toMatchObject({
        successCount: 1,
        failureCount: 0,
        averageLatencyMs: 100,
        timestamp: currentHour.toISOString(),
      });
    });

    it('gets hourly buckets for 4d period', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const fiveDaysAgoBucket = {
        httpMonitorId: monitor.id,
        timestamp: fiveDaysAgo,
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
      };
      const threeDaysAgoBucket = {
        httpMonitorId: monitor.id,
        timestamp: threeDaysAgo,
        successCount: 3,
        failureCount: 4,
        averageLatencyMs: 200,
      };

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket(fiveDaysAgoBucket);
      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket(threeDaysAgoBucket);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/monitors/${monitor.id}/http_ping_buckets?period=4d`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(96);

      const expectedThreeDaysAgoBucket = response.body[3 * 24];
      expect(expectedThreeDaysAgoBucket).toMatchObject({
        successCount: threeDaysAgoBucket.successCount,
        failureCount: threeDaysAgoBucket.failureCount,
        averageLatencyMs: threeDaysAgoBucket.averageLatencyMs,
        timestamp: threeDaysAgo.toISOString(),
      });

      const nullBuckets = response.body.filter((bucket) => bucket === null);
      expect(nullBuckets).toHaveLength(95);
    });

    it('gets daily buckets for 90d period', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const now = new Date();
      const hundredDaysAgo = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      thirtyDaysAgo.setMinutes(0, 0, 0);

      const hundredDaysAgoBucket = {
        httpMonitorId: monitor.id,
        timestamp: hundredDaysAgo,
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
      };
      const thirtyDaysAgoBucket = {
        httpMonitorId: monitor.id,
        timestamp: thirtyDaysAgo,
        successCount: 3,
        failureCount: 4,
        averageLatencyMs: 200,
      };

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket(hundredDaysAgoBucket);
      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket(thirtyDaysAgoBucket);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/monitors/${monitor.id}/http_ping_buckets?period=90d`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(90);

      const expectedThirtyDaysAgoBucket = response.body[30];
      const expectedTimestamp = new Date(thirtyDaysAgo.getTime());
      expectedTimestamp.setUTCHours(0, 0, 0, 0);
      expect(expectedThirtyDaysAgoBucket).toMatchObject({
        successCount: thirtyDaysAgoBucket.successCount,
        failureCount: thirtyDaysAgoBucket.failureCount,
        averageLatencyMs: thirtyDaysAgoBucket.averageLatencyMs,
        timestamp: expectedTimestamp.toISOString(),
      });

      const nullBuckets = response.body.filter((bucket) => bucket === null);
      expect(nullBuckets).toHaveLength(89);
    });

    it('gets virtual bucket for current day for no daily bucket yet created', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);

      const tenDaysAgoBucket = {
        httpMonitorId: monitor.id,
        timestamp: tenDaysAgo,
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
      };

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket(tenDaysAgoBucket);
      await bootstrap.utils.httpPingUtils.createHttpPing({ httpMonitorId: monitor.id });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/monitors/${monitor.id}/http_ping_buckets?period=90d`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(90);
      expect(response.body[0]).toMatchObject({
        successCount: 1,
        failureCount: 0,
        averageLatencyMs: 100,
        timestamp: today.toISOString(),
      });

      const expectedTenDaysAgoBucket = response.body[10];
      expect(expectedTenDaysAgoBucket).toMatchObject({
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
        timestamp: tenDaysAgo.toISOString(),
      });

      const nullBuckets = response.body.filter((bucket) => bucket === null);
      expect(nullBuckets).toHaveLength(88);
    });
  });
});
