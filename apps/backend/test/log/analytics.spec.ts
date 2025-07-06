import * as request from 'supertest';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { CreateLogDto } from '../../src/log/write/dto/create-log.dto';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';
import { LogWriteService } from '../../src/log/write/log-write.service';
import { subHours } from 'date-fns';

describe('LogCoreController (analytics)', () => {
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

  describe('GET /projects/:projectId/logs/analytics/v1', () => {
    it('returns bucketed analytics with auto-selected buckets', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const logWriteService = await bootstrap.app.get(LogWriteService);

      const logs: CreateLogDto[] = [
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:02:00Z'),
          message: 'test info 1',
          level: LogLevel.Info,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:03:00Z'),
          message: 'test warning 1',
          level: LogLevel.Warning,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:07:00Z'),
          message: 'test error 1',
          level: LogLevel.Error,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:08:00Z'),
          message: 'test info 2',
          level: LogLevel.Info,
          projectId: project.id,
        },
      ];

      await logWriteService.createMany(logs);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics/v1`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T10:14:00Z',
        });

      // then
      expect(response.status).toEqual(200);
      expect(response.body.bucketSizeMinutes).toEqual(1);
      expect(response.body.totalLogs).toEqual(4);
      expect(response.body.buckets.length).toBeGreaterThan(0);

      // verify that buckets are properly aligned
      const firstBucket = response.body.buckets[0];
      expect(firstBucket.bucketStart).toEqual('2024-01-01T10:00:00.000Z');
      expect(
        new Date(firstBucket.bucketEnd).getTime() - new Date(firstBucket.bucketStart).getTime(),
      ).toEqual(60000); // 1 minute

      // verify total logs match
      const totalLogsFromBuckets = response.body.buckets.reduce(
        (sum, bucket) => sum + bucket.countTotal,
        0,
      );
      expect(totalLogsFromBuckets).toEqual(4);
    });

    it('aligns buckets correctly for unaligned time ranges', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const logWriteService = await bootstrap.app.get(LogWriteService);

      const logs: CreateLogDto[] = [
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T17:02:00Z'),
          message: 'test log 1',
          level: LogLevel.Info,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T17:06:30Z'),
          message: 'test log 2',
          level: LogLevel.Error,
          projectId: project.id,
        },
      ];

      await logWriteService.createMany(logs);

      // when - request 17:02-17:07 (5 minutes)
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics/v1`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T17:02:10Z',
          endDate: '2024-01-01T17:07:10Z',
        });

      // then - should auto-select 1-minute buckets and align to boundaries
      expect(response.status).toEqual(200);
      expect(response.body.bucketSizeMinutes).toEqual(1);
      expect(response.body.buckets.length).toEqual(6);

      // verify alignment - first bucket should start at an aligned boundary
      const firstBucket = response.body.buckets[0];
      const firstBucketStart = new Date(firstBucket.bucketStart);
      expect(firstBucketStart.getUTCSeconds()).toEqual(0);
      expect(firstBucketStart.getUTCMilliseconds()).toEqual(0);

      // verify we captured both logs
      const totalLogsFromBuckets = response.body.buckets.reduce(
        (sum, bucket) => sum + bucket.countTotal,
        0,
      );
      expect(totalLogsFromBuckets).toEqual(2);
    });

    it('auto-selects appropriate bucket sizes for different time ranges', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const logWriteService = await bootstrap.app.get(LogWriteService);

      const logs: CreateLogDto[] = [
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:15:00Z'),
          message: 'test log 1',
          level: LogLevel.Info,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:45:00Z'),
          message: 'test log 2',
          level: LogLevel.Warning,
          projectId: project.id,
        },
      ];

      await logWriteService.createMany(logs);

      // when - test with 1 hour range
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics/v1`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T11:00:00Z',
        });

      // then - 1 hour (60 minutes) should select 5-minute buckets for ~12 buckets
      expect(response.status).toEqual(200);
      expect(response.body.bucketSizeMinutes).toEqual(5);
      expect(response.body.buckets.length).toEqual(12);

      // Verify bucket alignment
      const firstBucket = response.body.buckets[0];
      expect(firstBucket.bucketStart).toEqual('2024-01-01T10:00:00.000Z');

      // Verify logs are captured
      const totalLogsFromBuckets = response.body.buckets.reduce(
        (sum, bucket) => sum + bucket.countTotal,
        0,
      );
      expect(totalLogsFromBuckets).toEqual(2);
    });

    it('groups logs by all available levels', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const logWriteService = await bootstrap.app.get(LogWriteService);

      const logs: CreateLogDto[] = [
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:01:00Z'),
          message: 'info log',
          level: LogLevel.Info,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:02:00Z'),
          message: 'warning log',
          level: LogLevel.Warning,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:03:00Z'),
          message: 'error log',
          level: LogLevel.Error,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:04:00Z'),
          message: 'http log',
          level: LogLevel.Http,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:05:00Z'),
          message: 'verbose log',
          level: LogLevel.Verbose,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:06:00Z'),
          message: 'debug log',
          level: LogLevel.Debug,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:07:00Z'),
          message: 'silly log',
          level: LogLevel.Silly,
          projectId: project.id,
        },
      ];

      await logWriteService.createMany(logs);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics/v1`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T10:15:00Z',
        });

      // then
      expect(response.status).toEqual(200);
      expect(response.body.totalLogs).toEqual(7);
      expect(response.body.bucketSizeMinutes).toEqual(1); // 15 minutes should select 1-minute buckets

      // Verify all log levels are properly counted across buckets
      const totalCounts = response.body.buckets.reduce(
        (totals, bucket) => ({
          [LogLevel.Info]: totals[LogLevel.Info] + bucket.countByLevel[LogLevel.Info],
          [LogLevel.Warning]: totals[LogLevel.Warning] + bucket.countByLevel[LogLevel.Warning],
          [LogLevel.Error]: totals[LogLevel.Error] + bucket.countByLevel[LogLevel.Error],
          [LogLevel.Http]: totals[LogLevel.Http] + bucket.countByLevel[LogLevel.Http],
          [LogLevel.Verbose]: totals[LogLevel.Verbose] + bucket.countByLevel[LogLevel.Verbose],
          [LogLevel.Debug]: totals[LogLevel.Debug] + bucket.countByLevel[LogLevel.Debug],
          [LogLevel.Silly]: totals[LogLevel.Silly] + bucket.countByLevel[LogLevel.Silly],
          total: totals.total + bucket.countTotal,
        }),
        {
          [LogLevel.Info]: 0,
          [LogLevel.Warning]: 0,
          [LogLevel.Error]: 0,
          [LogLevel.Http]: 0,
          [LogLevel.Verbose]: 0,
          [LogLevel.Debug]: 0,
          [LogLevel.Silly]: 0,
          total: 0,
        },
      );

      expect(totalCounts[LogLevel.Info]).toEqual(1);
      expect(totalCounts[LogLevel.Warning]).toEqual(1);
      expect(totalCounts[LogLevel.Error]).toEqual(1);
      expect(totalCounts[LogLevel.Http]).toEqual(1);
      expect(totalCounts[LogLevel.Verbose]).toEqual(1);
      expect(totalCounts[LogLevel.Debug]).toEqual(1);
      expect(totalCounts[LogLevel.Silly]).toEqual(1);
      expect(totalCounts.total).toEqual(7);
    });

    it('auto-selects larger buckets for longer time ranges', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const logWriteService = await bootstrap.app.get(LogWriteService);

      const logs: CreateLogDto[] = [
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:30:00Z'),
          message: 'first day log',
          level: LogLevel.Info,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-05T11:30:00Z'),
          message: 'later day log',
          level: LogLevel.Error,
          projectId: project.id,
        },
      ];

      await logWriteService.createMany(logs);

      // when - test with 7 day range (should select larger buckets)
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics/v1`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-08T00:00:00Z',
        });

      // then - 7 days should select hour-based buckets to stay under 30 buckets
      expect(response.status).toEqual(200);
      expect(response.body.bucketSizeMinutes).toEqual(480); // 8-hour buckets
      expect(response.body.buckets.length).toEqual(21);
      expect(response.body.totalLogs).toEqual(2);
    });

    it('returns empty results when no logs exist', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics/v1`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T11:00:00Z',
        });

      // then
      expect(response.status).toEqual(200);
      expect(response.body.totalLogs).toEqual(0);
      expect(response.body.buckets).toHaveLength(12); // 12 * 5 minute buckets
    });

    it('throws 403 when user is not a member of cluster', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const otherSetup = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/logs/analytics/v1`)
        .set('Authorization', `Bearer ${otherSetup.token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T11:00:00Z',
        });

      // then
      expect(response.status).toEqual(403);
    });

    it('respects retention cutoff for free tier projects', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const logWriteService = await bootstrap.app.get(LogWriteService);

      const now = new Date();
      const twentyFiveHoursAgo = subHours(now, 25);
      const twentyThreeHoursAgo = subHours(now, 23);
      const oneHourAgo = subHours(now, 1);

      const logs: CreateLogDto[] = [
        {
          id: new Types.ObjectId().toString(),
          createdAt: twentyFiveHoursAgo,
          message: 'Log from 25 hours ago',
          level: LogLevel.Info,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: twentyThreeHoursAgo,
          message: 'Log from 23 hours ago',
          level: LogLevel.Warning,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: oneHourAgo,
          message: 'Log from 1 hour ago',
          level: LogLevel.Error,
          projectId: project.id,
        },
      ];

      await logWriteService.createMany(logs);

      // when - request analytics starting from 25 hours ago
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics/v1`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: twentyFiveHoursAgo.toISOString(),
          endDate: now.toISOString(),
        });

      // then - should only include logs within 24h retention period
      expect(response.status).toEqual(200);
      expect(response.body.totalLogs).toEqual(2);

      // verify only logs from within retention period are included
      const totalCounts = response.body.buckets.reduce(
        (totals, bucket) => ({
          [LogLevel.Info]: totals[LogLevel.Info] + bucket.countByLevel[LogLevel.Info],
          [LogLevel.Warning]: totals[LogLevel.Warning] + bucket.countByLevel[LogLevel.Warning],
          [LogLevel.Error]: totals[LogLevel.Error] + bucket.countByLevel[LogLevel.Error],
          total: totals.total + bucket.countTotal,
        }),
        {
          [LogLevel.Info]: 0,
          [LogLevel.Warning]: 0,
          [LogLevel.Error]: 0,
          total: 0,
        },
      );

      expect(totalCounts[LogLevel.Info]).toEqual(0);
      expect(totalCounts[LogLevel.Warning]).toEqual(1);
      expect(totalCounts[LogLevel.Error]).toEqual(1);
      expect(totalCounts.total).toEqual(2);
    });
  });
});
