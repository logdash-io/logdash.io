import * as request from 'supertest';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { createTestApp } from '../utils/bootstrap';
import { RedisService } from '../../src/shared/redis/redis.service';
import { sleep } from '../utils/sleep';
import { ClickHouseClient } from '@clickhouse/client';
import { LogClickhouseNormalized } from '../../src/log/core/entities/log.interface';
import { LogSerializer } from '../../src/log/core/entities/log.serializer';
import { addMinutes, subMinutes, subHours, addHours } from 'date-fns';

describe('LogCoreController (reads)', () => {
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

  describe('GET /projects/:projectId/logs/v2', () => {
    it('reads logs with direction', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      // given
      const createdAt = subHours(new Date(), 12);

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subMinutes(createdAt, 1).toISOString(),
        message: 'Test message',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: createdAt.toISOString(),
        message: 'Test message',
        level: LogLevel.Info,
        withoutSleep: true,
        sequenceNumber: 2,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: createdAt.toISOString(),
        message: 'Test message',
        level: LogLevel.Info,
        withoutSleep: true,
        sequenceNumber: 3,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: createdAt.toISOString(),
        message: 'Test message',
        level: LogLevel.Info,
        withoutSleep: true,
        sequenceNumber: 4,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: addMinutes(createdAt, 1).toISOString(),
        message: 'Test message',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await sleep(1_500);

      const clickhouseClient = bootstrap.app.get(ClickHouseClient);

      const orderedLogsResult = await clickhouseClient.query({
        query: `
          SELECT * FROM logs
          WHERE project_id = '${setup.project.id}'
          ORDER BY created_at ASC, sequence_number ASC
        `,
      });

      const logsData = (await orderedLogsResult.json()) as any;

      const logs: LogClickhouseNormalized[] = logsData.data.map((log: any) =>
        LogSerializer.normalizeClickhouse(log),
      );

      const [first, second, third, fourth, fifth] = logs;

      const responseSecond = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/logs/v2?direction=before&lastId=${third.id}&limit=1`)
        .set('Authorization', `Bearer ${setup.token}`);

      const responseFourth = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/logs/v2?direction=after&lastId=${third.id}&limit=1`)
        .set('Authorization', `Bearer ${setup.token}`);

      const responseFirst = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/logs/v2?direction=before&lastId=${second.id}&limit=1`)
        .set('Authorization', `Bearer ${setup.token}`);

      const responseFifth = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/logs/v2?direction=after&lastId=${fourth.id}&limit=1`)
        .set('Authorization', `Bearer ${setup.token}`);

      expect(responseSecond.body[0].id).toEqual(second.id);
      expect(responseFourth.body[0].id).toEqual(fourth.id);
      expect(responseFirst.body[0].id).toEqual(first.id);
      expect(responseFifth.body[0].id).toEqual(fifth.id);
    });

    it('returns 403 if user does not belong to cluster', async () => {
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setupA.project.id}/logs/v2?direction=before&lastId=123&limit=1`)
        .set('Authorization', `Bearer ${setupB.token}`);

      expect(response.status).toEqual(403);
    });

    it('reads logs from demo project without authorization and uses cache', async () => {
      const { project } = await bootstrap.utils.demoUtils.setupDemoProject();

      const response = await request(bootstrap.app.getHttpServer()).get(
        `/projects/${project.id}/logs/v2`,
      );

      await sleep(100);

      const redisService = bootstrap.app.get(RedisService);

      const client = await redisService.getClient();
      const keys = await client.keys('demo-dashboard-path:*');
      const key = keys[0];

      const cachedResponseRaw = (await redisService.get(key))!;
      const cachedResponse = JSON.parse(cachedResponseRaw);

      expect(response.status).toEqual(200);
      expect(cachedResponse).toEqual(response.body);

      // and when
      await client.set(key, JSON.stringify([{ message: 'I like turtles' }]), {
        EX: 10,
      });

      const secondResponse = await request(bootstrap.app.getHttpServer()).get(
        `/projects/${project.id}/logs/v2`,
      );

      expect(secondResponse.status).toEqual(200);
      expect(secondResponse.body).toEqual([{ message: 'I like turtles' }]);
    });
  });

  describe('GET /projects/:projectId/logs/v2 (date range)', () => {
    it('reads logs with only startDate provided', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const baseDate = subHours(new Date(), 12);
      const startDate = subMinutes(baseDate, 30);

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subHours(baseDate, 1).toISOString(),
        message: 'Before start date',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: baseDate.toISOString(),
        message: 'After start date',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: addHours(baseDate, 1).toISOString(),
        message: 'Much after start date',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await sleep(1_500);

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/logs/v2?startDate=${startDate.toISOString()}`)
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.some((log) => log.message === 'After start date')).toBe(true);
      expect(response.body.some((log) => log.message === 'Much after start date')).toBe(true);
      expect(response.body.some((log) => log.message === 'Before start date')).toBe(false);
    });

    it('reads logs with only endDate provided', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const endDate = subHours(new Date(), 11);

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subHours(new Date(), 12).toISOString(),
        message: 'Before end date',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subHours(new Date(), 10).toISOString(),
        message: 'After end date',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await sleep(1_500);

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/logs/v2?endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].message).toEqual('Before end date');
    });

    it('reads logs with both startDate and endDate provided', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const startDate = subHours(new Date(), 12);
      const endDate = subHours(new Date(), 11);

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subHours(new Date(), 13).toISOString(),
        message: 'Before range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subHours(new Date(), 11.5).toISOString(),
        message: 'In range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subHours(new Date(), 10).toISOString(),
        message: 'After range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await sleep(1_500);

      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setup.project.id}/logs/v2?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].message).toEqual('In range');
    });

    it('reads logs with date range and level filter', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const startDate = subHours(new Date(), 12);
      const endDate = subHours(new Date(), 11);

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subHours(new Date(), 11.5).toISOString(),
        message: 'Info log in range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subMinutes(subHours(new Date(), 11.5), 10).toISOString(),
        message: 'Error log in range',
        level: LogLevel.Error,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subMinutes(subHours(new Date(), 11.5), 20).toISOString(),
        message: 'Warning log in range',
        level: LogLevel.Warning,
        withoutSleep: true,
      });

      await sleep(1_500);

      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setup.project.id}/logs/v2?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&level=${LogLevel.Error}`,
        )
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].message).toEqual('Error log in range');
      expect(response.body[0].level).toEqual(LogLevel.Error);
    });

    it('returns empty array when no logs match date range', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const startDate = subHours(new Date(), 12);
      const endDate = subHours(new Date(), 11);

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subHours(new Date(), 13).toISOString(),
        message: 'Before range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subHours(new Date(), 10).toISOString(),
        message: 'After range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await sleep(1_500);

      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setup.project.id}/logs/v2?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(0);
    });

    it('throws error when combining lastId with date range', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const startDate = subHours(new Date(), 12);

      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setup.project.id}/logs/v2?lastId=someId&startDate=${startDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'If using pagination, provide both lastId and direction',
      );
    });

    it('throws error when combining direction with date range', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const startDate = subHours(new Date(), 12);

      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setup.project.id}/logs/v2?direction=after&startDate=${startDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'If using pagination, provide both lastId and direction',
      );
    });

    it('respects limit parameter with date range', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const startDate = subHours(new Date(), 12);
      const endDate = subHours(new Date(), 11);

      for (let i = 0; i < 5; i++) {
        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 11.5), i * 2).toISOString(),
          message: `Log ${i}`,
          level: LogLevel.Info,
          withoutSleep: true,
        });
      }

      await sleep(1_500);

      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setup.project.id}/logs/v2?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=3`,
        )
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(3);
    });

    it('combines lastId/direction with date range filtering', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const baseDate = subHours(new Date(), 12);
      const startDate = subMinutes(baseDate, 5);
      const endDate = addMinutes(baseDate, 25);

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: baseDate.toISOString(),
        message: 'Reference log',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: subMinutes(startDate, 2).toISOString(),
        message: 'Log before date range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: addMinutes(baseDate, 10).toISOString(),
        message: 'Log in date range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: addMinutes(baseDate, 20).toISOString(),
        message: 'Another log in date range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: addMinutes(baseDate, 30).toISOString(),
        message: 'Log after date range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await sleep(1_500);

      const clickhouseClient = bootstrap.app.get(ClickHouseClient);

      const orderedLogsResult = await clickhouseClient.query({
        query: `
          SELECT * FROM logs
          WHERE project_id = '${setup.project.id}'
          ORDER BY created_at ASC, sequence_number ASC
        `,
      });

      const logsData = (await orderedLogsResult.json()) as any;

      const logs: LogClickhouseNormalized[] = logsData.data.map((log: any) =>
        LogSerializer.normalizeClickhouse(log),
      );

      const referenceLog = logs.find((log) => log.message === 'Reference log');
      expect(referenceLog).toBeDefined();

      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setup.project.id}/logs/v2?direction=after&lastId=${referenceLog!.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(200);
      expect(response.body.some((log) => log.message === 'Log in date range')).toBe(true);
      expect(response.body.some((log) => log.message === 'Another log in date range')).toBe(true);
      expect(response.body.some((log) => log.message === 'Log before date range')).toBe(false);
      expect(response.body.some((log) => log.message === 'Log after date range')).toBe(false);
      expect(response.body.some((log) => log.message === 'Reference log')).toBe(false);
      expect(response.body).toHaveLength(2);
    });

    it('respects retention cutoff for free tier projects', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const now = new Date();
      const twentyFiveHoursAgo = subHours(now, 25);
      const twentyThreeHoursAgo = subHours(now, 23);
      const oneHourAgo = subHours(now, 1);

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: twentyFiveHoursAgo.toISOString(),
        message: 'Log from 25 hours ago',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: twentyThreeHoursAgo.toISOString(),
        message: 'Log from 23 hours ago',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: oneHourAgo.toISOString(),
        message: 'Log from 1 hour ago',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await sleep(1_500);

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/logs/v2?startDate=${twentyFiveHoursAgo.toISOString()}`)
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.some((log) => log.message === 'Log from 25 hours ago')).toBe(false);
      expect(response.body.some((log) => log.message === 'Log from 23 hours ago')).toBe(true);
      expect(response.body.some((log) => log.message === 'Log from 1 hour ago')).toBe(true);
    });
  });

  describe('Search functionality', () => {
    describe('GET /projects/:projectId/logs/v2 (with search)', () => {
      it('searches logs with single word', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'alice loves bob',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 1).toISOString(),
          message: 'bob has cat',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 2).toISOString(),
          message: 'charlie has dog',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(`/projects/${setup.project.id}/logs/v2?searchString=alice`)
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].message).toEqual('alice loves bob');
      });

      it('searches logs with multiple words (AND logic)', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'alice loves bob',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 1).toISOString(),
          message: 'bob has cat',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 2).toISOString(),
          message: 'alice has apples',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(`/projects/${setup.project.id}/logs/v2?searchString=alice bob`)
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].message).toEqual('alice loves bob');
      });

      it('search is case insensitive', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'ALICE LOVES BOB',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(`/projects/${setup.project.id}/logs/v2?searchString=alice bob`)
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].message).toEqual('ALICE LOVES BOB');
      });

      it('returns empty array when no logs match search', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'alice loves bob',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(`/projects/${setup.project.id}/logs/v2?searchString=nonexistent`)
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(0);
      });

      it('combines search with other filters', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'alice loves bob',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 1).toISOString(),
          message: 'alice has error',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(`/projects/${setup.project.id}/logs/v2?searchString=alice&limit=1`)
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(1);
      });

      it('combines search with date range filter', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        const startDate = subHours(new Date(), 12);
        const endDate = subHours(new Date(), 11);

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 13).toISOString(),
          message: 'alice before range',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 11.5).toISOString(),
          message: 'alice in range',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 11.5), 10).toISOString(),
          message: 'bob in range',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(
            `/projects/${setup.project.id}/logs/v2?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&searchString=alice`,
          )
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].message).toEqual('alice in range');
      });

      it('combines search with level filter', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'alice info log',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 1).toISOString(),
          message: 'alice error log',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 2).toISOString(),
          message: 'bob error log',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(`/projects/${setup.project.id}/logs/v2?searchString=alice&level=${LogLevel.Error}`)
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].message).toEqual('alice error log');
        expect(response.body[0].level).toEqual(LogLevel.Error);
      });
    });
  });

  describe('Multiple levels filtering', () => {
    describe('GET /projects/:projectId/logs/v2 (with levels array)', () => {
      it('filters logs by multiple levels', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'info log',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 1).toISOString(),
          message: 'error log',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 2).toISOString(),
          message: 'warning log',
          level: LogLevel.Warning,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 3).toISOString(),
          message: 'debug log',
          level: LogLevel.Debug,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(
            `/projects/${setup.project.id}/logs/v2?levels=${LogLevel.Error}&levels=${LogLevel.Warning}`,
          )
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(2);
        expect(
          response.body.every((log) => [LogLevel.Error, LogLevel.Warning].includes(log.level)),
        ).toBe(true);
      });

      it('filters logs by single level in levels array', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'info log',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 1).toISOString(),
          message: 'error log',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(`/projects/${setup.project.id}/logs/v2?levels=${LogLevel.Error}`)
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].level).toEqual(LogLevel.Error);
      });

      it('levels takes precedence over level when both provided', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'info log',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 1).toISOString(),
          message: 'error log',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 2).toISOString(),
          message: 'warning log',
          level: LogLevel.Warning,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(
            `/projects/${setup.project.id}/logs/v2?level=${LogLevel.Info}&levels=${LogLevel.Error}&levels=${LogLevel.Warning}`,
          )
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(2);
        expect(
          response.body.every((log) => [LogLevel.Error, LogLevel.Warning].includes(log.level)),
        ).toBe(true);
        expect(response.body.some((log) => log.level === LogLevel.Info)).toBe(false);
      });

      it('combines multiple levels with search filter', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 12).toISOString(),
          message: 'alice info log',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 1).toISOString(),
          message: 'alice error log',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 2).toISOString(),
          message: 'bob error log',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 12), 3).toISOString(),
          message: 'alice warning log',
          level: LogLevel.Warning,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(
            `/projects/${setup.project.id}/logs/v2?searchString=alice&levels=${LogLevel.Error}&levels=${LogLevel.Warning}`,
          )
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(2);
        expect(response.body.every((log) => log.message.includes('alice'))).toBe(true);
        expect(
          response.body.every((log) => [LogLevel.Error, LogLevel.Warning].includes(log.level)),
        ).toBe(true);
      });

      it('combines multiple levels with date range filter', async () => {
        const setup = await bootstrap.utils.generalUtils.setupAnonymous();

        const startDate = subHours(new Date(), 12);
        const endDate = subHours(new Date(), 11);

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 11.5).toISOString(),
          message: 'error log in range',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 11.5), 10).toISOString(),
          message: 'warning log in range',
          level: LogLevel.Warning,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subMinutes(subHours(new Date(), 11.5), 20).toISOString(),
          message: 'info log in range',
          level: LogLevel.Info,
          withoutSleep: true,
        });

        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: subHours(new Date(), 13).toISOString(),
          message: 'error log outside range',
          level: LogLevel.Error,
          withoutSleep: true,
        });

        await sleep(1_500);

        const response = await request(bootstrap.app.getHttpServer())
          .get(
            `/projects/${setup.project.id}/logs/v2?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&levels=${LogLevel.Error}&levels=${LogLevel.Warning}`,
          )
          .set('Authorization', `Bearer ${setup.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(2);
        expect(
          response.body.every((log) => [LogLevel.Error, LogLevel.Warning].includes(log.level)),
        ).toBe(true);
      });
    });
  });
});
