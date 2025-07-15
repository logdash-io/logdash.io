import { subDays, subHours } from 'date-fns';
import { advanceTo } from 'jest-date-mock';
import { Types } from 'mongoose';
import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

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

  describe('GET /monitors/:httpMonitorId/http_ping_buckets', () => {
    it('forbids access when user is not in cluster', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${new Types.ObjectId()}/http_ping_buckets`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      expect(response.status).toBe(403);
    });

    it('forbids access for free tier', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Free,
      });

      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: setup.token,
        projectId: setup.project.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${monitor.id}/http_ping_buckets?period=24h`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Buckets are not allowed for this project');
    });

    it('is not found for non existent monitor', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${new Types.ObjectId()}/http_ping_buckets`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      expect(response.status).toBe(403);
    });

    it('does not allow invalid period', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: setup.token,
        projectId: setup.project.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${monitor.id}/http_ping_buckets?period=invalid`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      expect(response.status).toBe(400);
    });

    it('gets hourly buckets for 24h period', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const now = new Date();
      const twoDaysAgo = subDays(now, 2);
      const twoHoursAgo = subHours(now, 2);
      const oneHourAgo = subHours(now, 1);
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

      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: twoDaysAgo,
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
      });
      await createBucket(twoHoursAgoBucket);
      await createBucket(oneHourAgoBucket);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${monitor.id}/http_ping_buckets?period=24h`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body.buckets).toHaveLength(24);

      const expectedOneHourAgoBucket = response.body.buckets[1];
      expect(expectedOneHourAgoBucket).toMatchObject({
        successCount: oneHourAgoBucket.successCount,
        failureCount: oneHourAgoBucket.failureCount,
        averageLatencyMs: oneHourAgoBucket.averageLatencyMs,
        timestamp: oneHourAgo.toISOString(),
      });

      const expectedTwoHoursAgoBucket = response.body.buckets[2];
      expect(expectedTwoHoursAgoBucket).toMatchObject({
        successCount: twoHoursAgoBucket.successCount,
        failureCount: twoHoursAgoBucket.failureCount,
        averageLatencyMs: twoHoursAgoBucket.averageLatencyMs,
        timestamp: twoHoursAgo.toISOString(),
      });

      const nullBuckets = response.body.buckets.filter((bucket) => bucket === null);
      expect(nullBuckets).toHaveLength(22);
    });

    it('gets virtual bucket for current hour', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });
      const currentHour = new Date();
      currentHour.setMinutes(0, 0, 0);
      await createPing({ httpMonitorId: monitor.id });
      await createPing({ httpMonitorId: monitor.id, responseTimeMs: 200, statusCode: 500 });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${monitor.id}/http_ping_buckets?period=24h`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body.buckets).toHaveLength(24);
      expect(response.body.buckets[0]).toMatchObject({
        successCount: 1,
        failureCount: 1,
        averageLatencyMs: 150,
        timestamp: currentHour.toISOString(),
      });
    });

    it('gets buckets only for the monitor', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });
      const otherMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const now = new Date();
      now.setMinutes(0, 0, 0);
      const twoHoursAgo = subHours(now, 2);

      await createPing({ httpMonitorId: monitor.id, statusCode: 200, responseTimeMs: 100 });
      await createPing({ httpMonitorId: otherMonitor.id, statusCode: 500, responseTimeMs: 200 });
      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: twoHoursAgo,
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
      });
      await createBucket({
        httpMonitorId: otherMonitor.id,
        timestamp: twoHoursAgo,
        successCount: 3,
        failureCount: 4,
        averageLatencyMs: 200,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${monitor.id}/http_ping_buckets?period=24h`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body.buckets).toHaveLength(24);
      expect(response.body.buckets[0]).toMatchObject({
        successCount: 1,
        failureCount: 0,
        averageLatencyMs: 100,
        timestamp: now.toISOString(),
      });
      expect(response.body.buckets[2]).toMatchObject({
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
        timestamp: twoHoursAgo.toISOString(),
      });
      const nullBuckets = response.body.buckets.filter((bucket) => bucket === null);
      expect(nullBuckets).toHaveLength(22);
    });

    it('gets hourly buckets for 4d period', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const now = new Date();
      const fiveDaysAgo = subDays(now, 5);
      const threeDaysAgo = subDays(now, 3);
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

      await createBucket(fiveDaysAgoBucket);
      await createBucket(threeDaysAgoBucket);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${monitor.id}/http_ping_buckets?period=4d`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body.buckets).toHaveLength(96);

      const expectedThreeDaysAgoBucket = response.body.buckets[3 * 24];
      expect(expectedThreeDaysAgoBucket).toMatchObject({
        successCount: threeDaysAgoBucket.successCount,
        failureCount: threeDaysAgoBucket.failureCount,
        averageLatencyMs: threeDaysAgoBucket.averageLatencyMs,
        timestamp: threeDaysAgo.toISOString(),
      });

      const nullBuckets = response.body.buckets.filter((bucket) => bucket === null);
      expect(nullBuckets).toHaveLength(95);
    });

    it('gets daily buckets for 90d period', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const now = new Date();
      const hundredDaysAgo = subDays(now, 100);
      const thirtyDaysAgo = subDays(now, 30);

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

      await createBucket(hundredDaysAgoBucket);
      await createBucket(thirtyDaysAgoBucket);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${monitor.id}/http_ping_buckets?period=90d`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body.buckets).toHaveLength(90);

      const expectedThirtyDaysAgoBucket = response.body.buckets[30];
      const expectedTimestamp = new Date(thirtyDaysAgo.getTime());
      expectedTimestamp.setUTCHours(0, 0, 0, 0);
      expect(expectedThirtyDaysAgoBucket).toMatchObject({
        successCount: thirtyDaysAgoBucket.successCount,
        failureCount: thirtyDaysAgoBucket.failureCount,
        averageLatencyMs: thirtyDaysAgoBucket.averageLatencyMs,
        timestamp: expectedTimestamp.toISOString(),
      });

      const nullBuckets = response.body.buckets.filter((bucket) => bucket === null);
      expect(nullBuckets).toHaveLength(89);
    });

    it('gets virtual bucket for current day when no bucket yet created for the day', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const tenDaysAgo = subDays(today, 10);

      const tenDaysAgoBucket = {
        httpMonitorId: monitor.id,
        timestamp: tenDaysAgo,
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
      };

      await createBucket(tenDaysAgoBucket);
      await createPing({ httpMonitorId: monitor.id });
      await createPing({ httpMonitorId: monitor.id, statusCode: 500, responseTimeMs: 200 });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/monitors/${monitor.id}/http_ping_buckets?period=90d`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body.buckets).toHaveLength(90);
      expect(response.body.buckets[0]).toMatchObject({
        successCount: 1,
        failureCount: 1,
        averageLatencyMs: 150,
        timestamp: today.toISOString(),
      });

      const expectedTenDaysAgoBucket = response.body.buckets[10];
      expect(expectedTenDaysAgoBucket).toMatchObject({
        successCount: 1,
        failureCount: 2,
        averageLatencyMs: 100,
        timestamp: tenDaysAgo.toISOString(),
      });

      const nullBuckets = response.body.buckets.filter((bucket) => bucket === null);
      expect(nullBuckets).toHaveLength(88);
    });
  });

  it('gets virtual bucket for current day when buckets for the day exist', async () => {
    // given
    const { token, project } = await bootstrap.utils.generalUtils.setupClaimed({
      userTier: UserTier.Pro,
    });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token,
      projectId: project.id,
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await createBucket({
      httpMonitorId: monitor.id,
      timestamp: today,
      successCount: 1,
      failureCount: 2,
      averageLatencyMs: 300,
    });
    await createPing({ httpMonitorId: monitor.id });
    await createPing({ httpMonitorId: monitor.id, statusCode: 500, responseTimeMs: 200 });

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/monitors/${monitor.id}/http_ping_buckets?period=90d`)
      .set('Authorization', `Bearer ${token}`);

    // then
    expect(response.status).toBe(200);
    expect(response.body.buckets).toHaveLength(90);
    expect(response.body.buckets[0]).toMatchObject({
      successCount: 2,
      failureCount: 3,
      averageLatencyMs: 240,
      timestamp: today.toISOString(),
    });

    const nullBuckets = response.body.buckets.filter((bucket) => bucket === null);
    expect(nullBuckets).toHaveLength(89);
  });

  async function createBucket(params: {
    httpMonitorId: string;
    timestamp?: Date;
    successCount?: number;
    failureCount?: number;
    averageLatencyMs?: number;
  }) {
    await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket(params);
  }

  async function createPing(params: {
    httpMonitorId: string;
    statusCode?: number;
    responseTimeMs?: number;
    message?: string;
    createdAt?: Date;
  }): Promise<void> {
    await bootstrap.utils.httpPingUtils.createHttpPing(params);
  }
});
