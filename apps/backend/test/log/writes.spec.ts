import { advanceBy } from 'jest-date-mock';
import { Types } from 'mongoose';
import * as request from 'supertest';
import { CreateLogBody } from '../../src/log/core/dto/create-log.body';
import { CreateLogsBatchBody } from '../../src/log/core/dto/create-logs-batch.body';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { LogRateLimitService } from '../../src/log/rate-limit/log-rate-limit.service';
import { LogTtlService } from '../../src/log/ttl/log-ttl.service';
import { RedisService } from '../../src/shared/redis/redis.service';
import { createTestApp } from '../utils/bootstrap';
import { removeKeysWhichWouldExpireInNextXSeconds } from '../utils/redis-test-container-server';
import { sleep } from '../utils/sleep';
import { LogWriteClickhouseService } from '../../src/log/write/log-write.clickhouse-service';
import { subDays } from 'date-fns';
import { ClickHouseClient } from '@clickhouse/client';

describe('LogCoreController (writes)', () => {
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

  it('removes old partitions', async () => {
    // given
    const logWriteService = await bootstrap.app.get(LogWriteClickhouseService);
    const ttlService = await bootstrap.app.get(LogTtlService);

    // 33 days ago
    await logWriteService.create({
      id: new Types.ObjectId().toString(),
      createdAt: subDays(new Date(), 33),
      message: 'test',
      level: LogLevel.Info,
      projectId: 'mock',
    });

    // 32 days ago
    await logWriteService.create({
      id: new Types.ObjectId().toString(),
      createdAt: subDays(new Date(), 32),
      message: 'test',
      level: LogLevel.Info,
      projectId: 'mock',
    });

    // 31 days ago
    await logWriteService.create({
      id: new Types.ObjectId().toString(),
      createdAt: subDays(new Date(), 31),
      message: 'test',
      level: LogLevel.Info,
      projectId: 'mock',
    });

    // 30 days ago
    await logWriteService.create({
      id: new Types.ObjectId().toString(),
      createdAt: subDays(new Date(), 30),
      message: 'test',
      level: LogLevel.Info,
      projectId: 'mock',
    });

    const dataBefore = await bootstrap.app.get(ClickHouseClient).query({
      query: `SELECT count() FROM logs`,
    });

    const countBefore = ((await dataBefore.json()) as any).data[0]['count()'];

    await ttlService.removeOldLogs();

    const dataAfter = await bootstrap.app.get(ClickHouseClient).query({
      query: `SELECT count() FROM logs`,
    });

    const countAfter = ((await dataAfter.json()) as any).data[0]['count()'];

    expect(Number(countAfter)).toEqual(Number(countBefore) - 1);
  });

  it('applies rate limit', async () => {
    const redisService = await bootstrap.app.get(RedisService);

    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();
    const date = new Date();

    const dto: CreateLogBody = {
      createdAt: date.toISOString(),
      message: 'test message',
      level: LogLevel.Info,
    };

    const logRateLimitService = await bootstrap.app.get(LogRateLimitService);

    // when
    await logRateLimitService.requireWithinLimit(apiKey.projectId); // add 1 log

    advanceBy(30 * 60 * 1_000); // 30 minutes

    for (let i = 0; i < 9999; i++) {
      try {
        await logRateLimitService.requireWithinLimit(apiKey.projectId);
      } catch {}
    }

    const response = await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', apiKey.value)
      .send(dto);

    // then
    expect(response.status).toEqual(429);

    await removeKeysWhichWouldExpireInNextXSeconds(redisService.getClient(), 3600);

    // and when
    advanceBy(35 * 60 * 1_000); // 35 minutes
    const responseAfterReset = await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', apiKey.value)
      .send(dto);

    // then
    expect(responseAfterReset.status).toEqual(201);
  }, 10_000);

  it('applies rate limit for adding test log', async () => {
    // given
    const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    for (let i = 0; i < 10; i++) {
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/test-log`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ip: '127.0.0.1' });

      expect(response.status).toEqual(201);
    }

    // then
    const response = await request(bootstrap.app.getHttpServer())
      .post(`/projects/${project.id}/test-log`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ip: '127.0.0.1' });

    expect(response.status).toEqual(429);
  });

  describe('POST /logs/batch', () => {
    it('creates multiple logs in batch', async () => {
      // given
      const { apiKey, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const date = new Date();

      const batchDto: CreateLogsBatchBody = {
        logs: [
          {
            createdAt: date.toISOString(),
            message: 'test message 1',
            level: LogLevel.Info,
          },
          {
            createdAt: date.toISOString(),
            message: 'test message 2',
            level: LogLevel.Error,
            sequenceNumber: 123,
          },
          {
            createdAt: date.toISOString(),
            message: 'test message 3',
            level: LogLevel.Debug,
          },
        ],
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post('/logs/batch')
        .set('project-api-key', apiKey.value)
        .send(batchDto);

      expect(response.body.success).toEqual(true);
      expect(response.status).toEqual(201);

      await sleep(1_500);

      // then
      const logs = await bootstrap.utils.logUtils.readLogs(project.id);

      expect(logs).toHaveLength(3);
      expect(logs.find((log) => log.message === 'test message 1')).toBeDefined();
      expect(logs.find((log) => log.message === 'test message 2')).toBeDefined();
      expect(logs.find((log) => log.message === 'test message 3')).toBeDefined();
      expect(logs.find((log) => log.level === LogLevel.Error)).toBeDefined();
    });

    it('validates maximum batch size of 100 logs', async () => {
      // given
      const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();
      const date = new Date();

      const logs = Array.from({ length: 101 }, (_, i) => ({
        createdAt: date.toISOString(),
        message: `test message ${i + 1}`,
        level: LogLevel.Info,
      }));

      const batchDto: CreateLogsBatchBody = { logs };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post('/logs/batch')
        .set('project-api-key', apiKey.value)
        .send(batchDto);

      // then
      expect(response.status).toEqual(400);
    });

    it('validates individual log entries in batch', async () => {
      // given
      const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

      const batchDto: CreateLogsBatchBody = {
        logs: [
          {
            createdAt: 'invalid-date',
            message: 'test message',
            level: LogLevel.Info,
          },
        ],
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post('/logs/batch')
        .set('project-api-key', apiKey.value)
        .send(batchDto);

      // then
      expect(response.status).toEqual(400);
    });

    it('applies rate limit for batch logs', async () => {
      const redisService = await bootstrap.app.get(RedisService);

      // given
      const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();
      const date = new Date();

      const logRateLimitService = await bootstrap.app.get(LogRateLimitService);

      // when - fill up most of the rate limit
      for (let i = 0; i < 9995; i++) {
        try {
          await logRateLimitService.requireWithinLimit(apiKey.projectId);
        } catch {}
      }

      // Create a batch that would exceed the rate limit
      const batchDto: CreateLogsBatchBody = {
        logs: Array.from({ length: 10 }, (_, i) => ({
          createdAt: date.toISOString(),
          message: `test message ${i + 1}`,
          level: LogLevel.Info,
        })),
      };

      const response = await request(bootstrap.app.getHttpServer())
        .post('/logs/batch')
        .set('project-api-key', apiKey.value)
        .send(batchDto);

      // then
      expect(response.status).toEqual(429);

      await removeKeysWhichWouldExpireInNextXSeconds(redisService.getClient(), 3600);

      // and when - after rate limit reset, batch should work
      advanceBy(35 * 60 * 1_000); // 35 minutes
      const responseAfterReset = await request(bootstrap.app.getHttpServer())
        .post('/logs/batch')
        .set('project-api-key', apiKey.value)
        .send(batchDto);

      // then
      expect(responseAfterReset.status).toEqual(201);
    }, 10_000);
  });
});
