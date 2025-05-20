import * as request from 'supertest';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { createTestApp } from '../utils/bootstrap';
import { RedisService } from '../../src/shared/redis/redis.service';
import { sleep } from '../utils/sleep';

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
      const { project, token } =
        await bootstrap.utils.generalUtils.setupAnonymous();

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
        .get(
          `/projects/${project.id}/logs?direction=before&lastId=${third.id}&limit=1`,
        )
        .set('Authorization', `Bearer ${token}`);
      const responseSecond = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${project.id}/logs?direction=after&lastId=${third.id}&limit=1`,
        )
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
      expect(response.body.message).toEqual(
        'User is not a member of this cluster',
      );
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
});
