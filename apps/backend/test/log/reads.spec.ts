import * as request from 'supertest';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { createTestApp } from '../utils/bootstrap';
import { RedisService } from '../../src/shared/redis/redis.service';
import { sleep } from '../utils/sleep';
import { ClickHouseClient } from '@clickhouse/client';
import { LogClickhouseNormalized } from '../../src/log/core/entities/log.interface';
import { LogSerializer } from '../../src/log/core/entities/log.serializer';
import { addMinutes, subMinutes } from 'date-fns';

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

  describe('GET /projects/:projectId/logs', () => {
    it('reads logs with direction', async () => {
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // given
      const createdAt = new Date('2000-01-01T11:00:00Z').toISOString();

      const first = await bootstrap.models.logModel.create({
        createdAt,
        index: 1,
        level: LogLevel.Info,
        message: 'Test message',
        projectId: project.id,
      });
      const second = await bootstrap.models.logModel.create({
        createdAt,
        index: 2,
        level: LogLevel.Info,
        message: 'Test message',
        projectId: project.id,
      });
      const third = await bootstrap.models.logModel.create({
        createdAt,
        index: 3,
        level: LogLevel.Info,
        message: 'Test message',
        projectId: project.id,
      });
      const fourth = await bootstrap.models.logModel.create({
        createdAt,
        index: 4,
        level: LogLevel.Info,
        message: 'Test message',
        projectId: project.id,
      });
      const fifth = await bootstrap.models.logModel.create({
        createdAt,
        index: 5,
        level: LogLevel.Info,
        message: 'Test message',
        projectId: project.id,
      });

      // when
      const responseFirst = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs?direction=before&lastId=${third.id}&limit=1`)
        .set('Authorization', `Bearer ${token}`);
      const responseSecond = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs?direction=after&lastId=${third.id}&limit=1`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(responseFirst.body[0].id).toEqual(second._id.toString());
      expect(responseSecond.body[0].id).toEqual(fourth._id.toString());
    });

    it('throws error if user does not belong to cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setupA.project.id}/logs`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toEqual(403);
      expect(response.body.message).toEqual('User is not a member of this cluster');
    });

    it('reads logs from demo project without authorization and uses cache', async () => {
      // given
      const { project } = await bootstrap.utils.demoUtils.setupDemoProject();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs`)
        .set('Authorization', `Bearer asd123`);

      await sleep(100);

      // the
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

      const secondResponse = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/logs`)
        .set('Authorization', `Bearer asd123`);

      // then
      expect(secondResponse.status).toEqual(200);
      expect(secondResponse.body).toEqual([{ message: 'I like turtles' }]);
    });
  });

  describe('GET /projects/:projectId/logs/v2', () => {
    it('reads logs with direction', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      // given
      const createdAt = new Date('2000-01-01T11:00:00Z');

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

      const baseDate = new Date('2023-01-01T12:00:00Z');
      const startDate = new Date('2023-01-01T11:30:00Z');

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T11:00:00Z').toISOString(),
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
        createdAt: new Date('2023-01-01T13:00:00Z').toISOString(),
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

      const endDate = new Date('2023-01-01T11:30:00Z');

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T11:00:00Z').toISOString(),
        message: 'Before end date',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T12:00:00Z').toISOString(),
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

      const startDate = new Date('2023-01-01T11:30:00Z');
      const endDate = new Date('2023-01-01T12:30:00Z');

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T11:00:00Z').toISOString(),
        message: 'Before range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T12:00:00Z').toISOString(),
        message: 'In range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T13:00:00Z').toISOString(),
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

      const startDate = new Date('2023-01-01T11:30:00Z');
      const endDate = new Date('2023-01-01T12:30:00Z');

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T12:00:00Z').toISOString(),
        message: 'Info log in range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T12:10:00Z').toISOString(),
        message: 'Error log in range',
        level: LogLevel.Error,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T12:20:00Z').toISOString(),
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

      const startDate = new Date('2023-01-01T11:30:00Z');
      const endDate = new Date('2023-01-01T12:30:00Z');

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T10:00:00Z').toISOString(),
        message: 'Before range',
        level: LogLevel.Info,
        withoutSleep: true,
      });

      await bootstrap.utils.logUtils.createLog({
        apiKey: setup.apiKey.value,
        createdAt: new Date('2023-01-01T14:00:00Z').toISOString(),
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

      const startDate = new Date('2023-01-01T11:30:00Z');

      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setup.project.id}/logs/v2?lastId=someId&startDate=${startDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('Provide either lastId+direction or startDate+endDate');
    });

    it('throws error when combining direction with date range', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const startDate = new Date('2023-01-01T11:30:00Z');

      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setup.project.id}/logs/v2?direction=after&startDate=${startDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${setup.token}`);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('Provide either lastId+direction or startDate+endDate');
    });

    it('respects limit parameter with date range', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const startDate = new Date('2023-01-01T11:30:00Z');
      const endDate = new Date('2023-01-01T12:30:00Z');

      for (let i = 0; i < 5; i++) {
        await bootstrap.utils.logUtils.createLog({
          apiKey: setup.apiKey.value,
          createdAt: new Date(`2023-01-01T12:${i.toString().padStart(2, '0')}:00Z`).toISOString(),
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
  });
});
