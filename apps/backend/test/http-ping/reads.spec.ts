import { expect } from '@jest/globals';
import { Types } from 'mongoose';
import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { HttpPingSerialized } from '../../src/http-ping/core/entities/http-ping.interface';

describe('Http Ping (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.clearDatabase();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('GET /clusters/:clusterId/monitors/:monitorId/http_pings', () => {
    it('forbids access when user is not in cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/projects/${setupA.project.id}/monitors/${new Types.ObjectId().toString()}/http_pings`,
        )
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toBe(403);
    });

    it('is not found for non existent monitor', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/monitors/${new Types.ObjectId().toString()}/http_pings`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      expect(response.status).toBe(404);
    });

    it('gets pings for a monitor', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token,
        projectId: project.id,
      });
      for (let i = 0; i < 10; i++) {
        await bootstrap.utils.httpPingUtils.createHttpPing({ httpMonitorId: monitor.id });
      }

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/monitors/${monitor.id}/http_pings`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      const pings = response.body as HttpPingSerialized[];
      expect(pings.length).toBe(10);
      expect(pings[0]).toMatchObject({
        statusCode: 200,
        responseTimeMs: expect.any(Number),
        message: 'Default HTTP ping',
      });
    });

    it('gets pings for a monitor with limit', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token,
        projectId: project.id,
      });

      for (let i = 0; i < 10; i++) {
        await bootstrap.utils.httpPingUtils.createHttpPing({ httpMonitorId: monitor.id });
      }

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/monitors/${monitor.id}/http_pings?limit=5`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect((response.body as HttpPingSerialized[]).length).toBe(5);
    });
  });
});
