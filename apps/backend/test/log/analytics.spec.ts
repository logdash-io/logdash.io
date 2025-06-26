import * as request from 'supertest';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { LogAnalyticsBucket } from '../../src/log/analytics/dto/log-analytics-query.dto';
import { LogWriteClickhouseService } from '../../src/log/write/log-write.clickhouse-service';
import { CreateLogDto } from '../../src/log/write/dto/create-log.dto';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';

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

  describe('GET /projects/:projectId/logs/analytics', () => {
    it('returns bucketed analytics with 5-minute buckets', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clickhouseService = await bootstrap.app.get(LogWriteClickhouseService);

      const baseDate = new Date('2024-01-01T10:00:00Z');
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

      await clickhouseService.createMany(logs);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T10:15:00Z',
          bucket: LogAnalyticsBucket.FiveMinutes,
        });

      // then
      expect(response.status).toEqual(200);
      expect(response.body.bucketSizeMinutes).toEqual(5);
      expect(response.body.totalLogs).toEqual(4);
      expect(response.body.buckets).toHaveLength(3);

      // First bucket (10:00-10:05)
      const firstBucket = response.body.buckets[0];
      expect(firstBucket.bucketStart).toEqual('2024-01-01T10:00:00.000Z');
      expect(firstBucket.bucketEnd).toEqual('2024-01-01T10:05:00.000Z');
      expect(firstBucket.infoCount).toEqual(1);
      expect(firstBucket.warningCount).toEqual(1);
      expect(firstBucket.errorCount).toEqual(0);
      expect(firstBucket.totalCount).toEqual(2);

      // Second bucket (10:05-10:10)
      const secondBucket = response.body.buckets[1];
      expect(secondBucket.bucketStart).toEqual('2024-01-01T10:05:00.000Z');
      expect(secondBucket.bucketEnd).toEqual('2024-01-01T10:10:00.000Z');
      expect(secondBucket.infoCount).toEqual(1);
      expect(secondBucket.warningCount).toEqual(0);
      expect(secondBucket.errorCount).toEqual(1);
      expect(secondBucket.totalCount).toEqual(2);
    });

    it('aligns buckets correctly for unaligned time ranges', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clickhouseService = await bootstrap.app.get(LogWriteClickhouseService);

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
          createdAt: new Date('2024-01-01T17:07:30Z'),
          message: 'test log 2',
          level: LogLevel.Error,
          projectId: project.id,
        },
      ];

      await clickhouseService.createMany(logs);

      // when - request 17:02-17:07 with 5-minute buckets
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T17:02:00Z',
          endDate: '2024-01-01T17:07:00Z',
          bucket: LogAnalyticsBucket.FiveMinutes,
        });

      // then - should get aligned buckets 17:00-17:05 and 17:05-17:10
      expect(response.status).toEqual(200);
      expect(response.body.buckets).toHaveLength(2);

      const firstBucket = response.body.buckets[0];
      expect(firstBucket.bucketStart).toEqual('2024-01-01T17:00:00.000Z');
      expect(firstBucket.bucketEnd).toEqual('2024-01-01T17:05:00.000Z');
      expect(firstBucket.totalCount).toEqual(1);

      const secondBucket = response.body.buckets[1];
      expect(secondBucket.bucketStart).toEqual('2024-01-01T17:05:00.000Z');
      expect(secondBucket.bucketEnd).toEqual('2024-01-01T17:10:00.000Z');
      expect(secondBucket.totalCount).toEqual(1);
    });

    it('returns analytics with different bucket sizes', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clickhouseService = await bootstrap.app.get(LogWriteClickhouseService);

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

      await clickhouseService.createMany(logs);

      // when - test with 30-minute buckets
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T11:00:00Z',
          bucket: LogAnalyticsBucket.ThirtyMinutes,
        });

      // then
      expect(response.status).toEqual(200);
      expect(response.body.bucketSizeMinutes).toEqual(30);
      expect(response.body.buckets).toHaveLength(2);

      const firstBucket = response.body.buckets[0];
      expect(firstBucket.bucketStart).toEqual('2024-01-01T10:00:00.000Z');
      expect(firstBucket.bucketEnd).toEqual('2024-01-01T10:30:00.000Z');
      expect(firstBucket.totalCount).toEqual(1);

      const secondBucket = response.body.buckets[1];
      expect(secondBucket.bucketStart).toEqual('2024-01-01T10:30:00.000Z');
      expect(secondBucket.bucketEnd).toEqual('2024-01-01T11:00:00.000Z');
      expect(secondBucket.totalCount).toEqual(1);
    });

    it('groups logs by all available levels', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clickhouseService = await bootstrap.app.get(LogWriteClickhouseService);

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

      await clickhouseService.createMany(logs);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T10:15:00Z',
          bucket: LogAnalyticsBucket.FifteenMinutes,
        });

      // then
      expect(response.status).toEqual(200);
      expect(response.body.totalLogs).toEqual(7);

      const bucket = response.body.buckets[0];
      expect(bucket.infoCount).toEqual(1);
      expect(bucket.warningCount).toEqual(1);
      expect(bucket.errorCount).toEqual(1);
      expect(bucket.httpCount).toEqual(1);
      expect(bucket.verboseCount).toEqual(1);
      expect(bucket.debugCount).toEqual(1);
      expect(bucket.sillyCount).toEqual(1);
      expect(bucket.totalCount).toEqual(7);
    });

    it('returns empty results when no logs exist', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T11:00:00Z',
          bucket: LogAnalyticsBucket.FiveMinutes,
        });

      // then
      expect(response.status).toEqual(200);
      expect(response.body.totalLogs).toEqual(0);
      expect(response.body.buckets).toEqual([]);
    });

    it('only returns logs for the specified project', async () => {
      // given
      const { project: project1, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const project2 = await bootstrap.utils.projectUtils.createDefaultProject();

      const clickhouseService = await bootstrap.app.get(LogWriteClickhouseService);

      const logs: CreateLogDto[] = [
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:01:00Z'),
          message: 'project 1 log',
          level: LogLevel.Info,
          projectId: project1.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:02:00Z'),
          message: 'project 2 log',
          level: LogLevel.Info,
          projectId: project2.id,
        },
      ];

      await clickhouseService.createMany(logs);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project1.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T10:10:00Z',
          bucket: LogAnalyticsBucket.FiveMinutes,
        });

      // then
      expect(response.status).toEqual(200);
      expect(response.body.totalLogs).toEqual(1);
      expect(response.body.buckets[0].totalCount).toEqual(1);
    });

    it('validates required parameters', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when - missing startDate
      const response1 = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          endDate: '2024-01-01T11:00:00Z',
          bucket: LogAnalyticsBucket.FiveMinutes,
        });

      // then
      expect(response1.status).toEqual(400);

      // when - missing endDate
      const response2 = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          bucket: LogAnalyticsBucket.FiveMinutes,
        });

      // then
      expect(response2.status).toEqual(400);

      // when - missing bucket
      const response3 = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T11:00:00Z',
        });

      // then
      expect(response3.status).toEqual(400);
    });

    it('validates date format', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: 'invalid-date',
          endDate: '2024-01-01T11:00:00Z',
          bucket: LogAnalyticsBucket.FiveMinutes,
        });

      // then
      expect(response.status).toEqual(400);
    });

    it('validates bucket enum values', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T11:00:00Z',
          bucket: 999, // invalid bucket value
        });

      // then
      expect(response.status).toEqual(400);
    });

    it('requires authentication', async () => {
      // given
      const { project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T11:00:00Z',
          bucket: LogAnalyticsBucket.FiveMinutes,
        });

      // then
      expect(response.status).toEqual(401);
    });

    it('works with hour-based buckets', async () => {
      // given
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clickhouseService = await bootstrap.app.get(LogWriteClickhouseService);

      const logs: CreateLogDto[] = [
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T10:30:00Z'),
          message: 'first hour log',
          level: LogLevel.Info,
          projectId: project.id,
        },
        {
          id: new Types.ObjectId().toString(),
          createdAt: new Date('2024-01-01T11:30:00Z'),
          message: 'second hour log',
          level: LogLevel.Error,
          projectId: project.id,
        },
      ];

      await clickhouseService.createMany(logs);

      // when - test with 1-hour buckets
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs/analytics`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T12:00:00Z',
          bucket: LogAnalyticsBucket.OneHour,
        });

      // then
      expect(response.status).toEqual(200);
      expect(response.body.bucketSizeMinutes).toEqual(60);
      expect(response.body.buckets).toHaveLength(2);

      const firstBucket = response.body.buckets[0];
      expect(firstBucket.bucketStart).toEqual('2024-01-01T10:00:00.000Z');
      expect(firstBucket.bucketEnd).toEqual('2024-01-01T11:00:00.000Z');
      expect(firstBucket.infoCount).toEqual(1);
      expect(firstBucket.totalCount).toEqual(1);

      const secondBucket = response.body.buckets[1];
      expect(secondBucket.bucketStart).toEqual('2024-01-01T11:00:00.000Z');
      expect(secondBucket.bucketEnd).toEqual('2024-01-01T12:00:00.000Z');
      expect(secondBucket.errorCount).toEqual(1);
      expect(secondBucket.totalCount).toEqual(1);
    });
  });
});
