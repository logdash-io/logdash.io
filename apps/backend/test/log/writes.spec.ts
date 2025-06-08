import { advanceBy } from 'jest-date-mock';
import { Types } from 'mongoose';
import * as request from 'supertest';
import { CreateLogBody } from '../../src/log/core/dto/create-log.body';
import { CreateLogsBatchBody } from '../../src/log/core/dto/create-logs-batch.body';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { LogIngestionService } from '../../src/log/ingestion/log-creation.service';
import { LogQueueingService } from '../../src/log/queueing/log-queueing.service';
import { LogRateLimitService } from '../../src/log/rate-limit/log-rate-limit.service';
import { LogTtlService } from '../../src/log/ttl/log-ttl.service';
import { CreateLogDto } from '../../src/log/write/dto/create-log.dto';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';
import { RedisService } from '../../src/shared/redis/redis.service';
import { createTestApp } from '../utils/bootstrap';
import { removeKeysWhichWouldExpireInNextXSeconds } from '../utils/redis-in-memory-server';
import { sleep } from '../utils/sleep';

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

  it('stores log', async () => {
    // given
    const { apiKey, project } = await bootstrap.utils.generalUtils.setupAnonymous();

    const date = new Date();

    const messageWithMoreThan4096Characters = 'a'.repeat(5000);

    const createLogDto: CreateLogBody = {
      createdAt: date.toISOString(),
      message: messageWithMoreThan4096Characters,
      level: LogLevel.Info,
    };

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', apiKey.value)
      .send(createLogDto);

    expect(response.body.success).toEqual(true);

    await sleep(1000);

    // then
    const log = (await bootstrap.models.logModel.findOne())!;

    expect(log.createdAt).toEqual(date);
    expect(log.message).toHaveLength(4096);
    expect(log.level).toEqual(LogLevel.Info);
    expect(log.projectId).toEqual(project.id);
  });

  it('indexes logs belonging to the same project', async () => {
    // given
    const service = await bootstrap.app.get(LogIngestionService);

    const project = await bootstrap.utils.projectUtils.createDefaultProject();
    const createdAt = new Date();

    const dtosFirstRun: CreateLogDto[] = [
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '1',
        level: LogLevel.Info,
        projectId: project.id,
      },
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '2',
        level: LogLevel.Info,
        projectId: project.id,
      },
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '3',
        level: LogLevel.Info,
        projectId: project.id,
      },
    ];

    // when
    await service.createLogs(dtosFirstRun);

    // then
    const logsAfterFirstRun = await bootstrap.models.logModel.find();
    const projectAfterFirstRun = (await bootstrap.models.projectModel.findOne())!;

    expect(logsAfterFirstRun).toHaveLength(3);
    expect(logsAfterFirstRun.find((log) => log.index === 0)).toBeDefined();
    expect(logsAfterFirstRun.find((log) => log.index === 1)).toBeDefined();
    expect(logsAfterFirstRun.find((log) => log.index === 2)).toBeDefined();
    expect(projectAfterFirstRun.logValues.currentIndex).toEqual(3);

    // and given
    const dtosSecondRun: CreateLogDto[] = [
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '4',
        level: LogLevel.Info,
        projectId: project.id,
      },
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '5',
        level: LogLevel.Info,
        projectId: project.id,
      },
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '6',
        level: LogLevel.Info,
        projectId: project.id,
      },
    ];

    // and when
    await service.createLogs(dtosSecondRun);

    // and then
    const logsAfterSecondRun = await bootstrap.models.logModel.find();
    const projectAfterSecondRun = (await bootstrap.models.projectModel.findOne())!;

    expect(logsAfterSecondRun).toHaveLength(6);
    expect(logsAfterSecondRun.find((log) => log.index === 3)).toBeDefined();
    expect(logsAfterSecondRun.find((log) => log.index === 4)).toBeDefined();
    expect(logsAfterSecondRun.find((log) => log.index === 5)).toBeDefined();
    expect(projectAfterSecondRun.logValues.currentIndex).toEqual(6);
  });

  it('indexes logs belonging to different projects', async () => {
    // given
    const projectA = await bootstrap.utils.projectUtils.createDefaultProject();
    const projectB = await bootstrap.utils.projectUtils.createDefaultProject();

    await bootstrap.models.projectModel.updateOne(
      { _id: projectA.id },
      { $set: { 'logValues.currentIndex': 1000 } },
    );
    await bootstrap.models.projectModel.updateOne(
      { _id: projectB.id },
      { $set: { 'logValues.currentIndex': 2000 } },
    );

    const createdAt = new Date();

    const dtos: CreateLogDto[] = [
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '1',
        level: LogLevel.Info,
        projectId: projectA.id,
      },
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '2',
        level: LogLevel.Info,
        projectId: projectA.id,
      },
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '1',
        level: LogLevel.Info,
        projectId: projectB.id,
      },
      {
        id: new Types.ObjectId().toString(),
        createdAt: createdAt,
        message: '2',
        level: LogLevel.Info,
        projectId: projectB.id,
      },
    ];

    // when
    await bootstrap.app.get(LogIngestionService).createLogs(dtos);

    // then
    const logs = await bootstrap.models.logModel.find();
    const projectAAfterRun = (await bootstrap.models.projectModel.findOne({
      _id: projectA.id,
    }))!;
    const projectBAfterRun = (await bootstrap.models.projectModel.findOne({
      _id: projectB.id,
    }))!;

    expect(logs).toHaveLength(4);
    expect(logs.find((log) => log.index === 1000)).toBeDefined();
    expect(logs.find((log) => log.index === 1001)).toBeDefined();
    expect(logs.find((log) => log.index === 2000)).toBeDefined();
    expect(logs.find((log) => log.index === 2001)).toBeDefined();
    expect(projectAAfterRun.logValues.currentIndex).toEqual(1002);
    expect(projectBAfterRun.logValues.currentIndex).toEqual(2002);
  });

  it('removes logs when they exceeded the limit', async () => {
    // given
    const logQueueingService = await bootstrap.app.get(LogQueueingService);
    const logTtlService = await bootstrap.app.get(LogTtlService);

    const freeProjectUnderLimit = await bootstrap.utils.projectUtils.createDefaultProject();
    const freeProjectOverLimit = await bootstrap.utils.projectUtils.createDefaultProject();

    const paidProjectUnderLimit = await bootstrap.utils.projectUtils.createDefaultProject({
      tier: ProjectTier.EarlyBird,
    });
    const paidProjectOverLimit = await bootstrap.utils.projectUtils.createDefaultProject({
      tier: ProjectTier.EarlyBird,
    });

    for (let i = 0; i < 1000; i++) {
      logQueueingService.queueLog({
        createdAt: new Date(),
        message: 'test',
        level: LogLevel.Info,
        projectId: freeProjectUnderLimit.id,
      });
    }
    for (let i = 0; i < 1600; i++) {
      logQueueingService.queueLog({
        createdAt: new Date(),
        message: 'test',
        level: LogLevel.Info,
        projectId: freeProjectOverLimit.id,
      });
    }
    for (let i = 0; i < 10000; i++) {
      logQueueingService.queueLog({
        createdAt: new Date(),
        message: 'test',
        level: LogLevel.Info,
        projectId: paidProjectUnderLimit.id,
      });
    }
    for (let i = 0; i < 16000; i++) {
      logQueueingService.queueLog({
        createdAt: new Date(),
        message: 'test',
        level: LogLevel.Info,
        projectId: paidProjectOverLimit.id,
      });
    }

    await sleep(10000);

    await logTtlService.removeOldLogs();

    const freeProjectUnderLimitAfterRun = (await bootstrap.models.projectModel.findOne({
      _id: freeProjectUnderLimit.id,
    }))!;
    const freeProjectOverLimitAfterRun = (await bootstrap.models.projectModel.findOne({
      _id: freeProjectOverLimit.id,
    }))!;
    const paidProjectUnderLimitAfterRun = (await bootstrap.models.projectModel.findOne({
      _id: paidProjectUnderLimit.id,
    }))!;
    const paidProjectOverLimitAfterRun = (await bootstrap.models.projectModel.findOne({
      _id: paidProjectOverLimit.id,
    }))!;

    const numberOfLogsForFreeProjectUnderLimit = await bootstrap.models.logModel.countDocuments({
      projectId: freeProjectUnderLimit.id,
    });

    const numberOfLogsForFreeProjectOverLimit = await bootstrap.models.logModel.countDocuments({
      projectId: freeProjectOverLimit.id,
    });

    const numberOfLogsForPaidProjectUnderLimit = await bootstrap.models.logModel.countDocuments({
      projectId: paidProjectUnderLimit.id,
    });

    const numberOfLogsForPaidProjectOverLimit = await bootstrap.models.logModel.countDocuments({
      projectId: paidProjectOverLimit.id,
    });

    // free project under limit
    expect(freeProjectUnderLimitAfterRun.logValues.lastDeletionIndex).toEqual(0);
    expect(freeProjectUnderLimitAfterRun.logValues.currentIndex).toEqual(1000);
    expect(numberOfLogsForFreeProjectUnderLimit).toEqual(1000);

    // free project over limit
    expect(freeProjectOverLimitAfterRun.logValues.lastDeletionIndex).toEqual(600);
    expect(freeProjectOverLimitAfterRun.logValues.currentIndex).toEqual(1600);
    expect(numberOfLogsForFreeProjectOverLimit).toEqual(1000);

    // paid project under limit
    expect(paidProjectUnderLimitAfterRun.logValues.lastDeletionIndex).toEqual(0);
    expect(paidProjectUnderLimitAfterRun.logValues.currentIndex).toEqual(10000);
    expect(numberOfLogsForPaidProjectUnderLimit).toEqual(10000);

    // paid project over limit
    expect(paidProjectOverLimitAfterRun.logValues.lastDeletionIndex).toEqual(6000);
    expect(paidProjectOverLimitAfterRun.logValues.currentIndex).toEqual(16000);
    expect(numberOfLogsForPaidProjectOverLimit).toEqual(10000);
  }, 15_000);

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

      await sleep(1000);

      // then
      const logs = await bootstrap.models.logModel.find({ projectId: project.id });

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
