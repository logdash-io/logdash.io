import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { RedisService } from '../../src/shared/redis/redis.service';
import { PublicDashboardDataResponse } from '../../src/public-dashboard/core/dto/public-dashboard-data.response';

describe('PublicDashboardCoreController (public data read)', () => {
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

  async function setupPublicDashboard(dto?: { isPublic?: boolean }) {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();

    const monitorA = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      name: 'A',
    });

    const monitorB = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      name: 'B',
    });

    const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
      clusterId: setup.cluster.id,
      token: setup.token,
      httpMonitorsIds: [monitorA.id, monitorB.id],
      name: 'test',
      isPublic: dto?.isPublic === undefined ? true : dto.isPublic,
    });

    await bootstrap.utils.httpPingUtils.createHttpPing({
      httpMonitorId: monitorA.id,
    });

    await bootstrap.utils.httpPingUtils.createHttpPing({
      httpMonitorId: monitorB.id,
    });

    return {
      ...setup,
      publicDashboard,
    };
  }

  describe('GET /public_dashboards/:publicDashboardId/public_data', () => {
    it('reads public data', async () => {
      // given
      const setup = await setupPublicDashboard();

      // when
      const response = await request(bootstrap.app.getHttpServer()).get(
        `/public_dashboards/${setup.publicDashboard.id}/public_data?period=24h`,
      );

      // then
      const data = response.body as PublicDashboardDataResponse;

      expect(response.status).toBe(200);

      expect(data.httpMonitors).toHaveLength(2);

      expect(data.httpMonitors[0].name).toBe('A');
      expect(data.httpMonitors[0].pings).toHaveLength(1);

      expect(data.httpMonitors[1].name).toBe('B');
      expect(data.httpMonitors[1].pings).toHaveLength(1);

      expect(data.httpMonitors[0].buckets).toHaveLength(24);
      expect(data.httpMonitors[1].buckets).toHaveLength(24);
    });

    it('uses cache', async () => {
      // given
      const setup = await setupPublicDashboard();

      // when
      const firstResponse = await request(bootstrap.app.getHttpServer()).get(
        `/public_dashboards/${setup.publicDashboard.id}/public_data?period=24h`,
      );

      const data = firstResponse.body as PublicDashboardDataResponse;

      data.httpMonitors = [];

      // and when
      const redisService = bootstrap.app.get(RedisService);
      await redisService.set(
        `public-dashboard:${setup.publicDashboard.id}:public-data:24h`,
        JSON.stringify(data),
      );

      // and when
      const secondResponse = await request(bootstrap.app.getHttpServer()).get(
        `/public_dashboards/${setup.publicDashboard.id}/public_data?period=24h`,
      );

      // then
      expect(secondResponse.body).toEqual(data);
    });

    it('returns 403 if dashboard is not public', async () => {
      // given
      const setup = await setupPublicDashboard();

      await bootstrap.utils.publicDashboardUtils.updatePublicDashboard({
        token: setup.token,
        id: setup.publicDashboard.id,
        isPublic: false,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer()).get(
        `/public_dashboards/${setup.publicDashboard.id}/public_data?period=24h`,
      );

      // then
      expect(response.status).toBe(403);
    });

    it('invalidates cache if user changes dashboard to public', async () => {
      // given
      const setup = await setupPublicDashboard({ isPublic: false });

      // when
      const firstResponse = await request(bootstrap.app.getHttpServer()).get(
        `/public_dashboards/${setup.publicDashboard.id}/public_data?period=24h`,
      );

      // then
      expect(firstResponse.status).toBe(403);

      // and when
      await bootstrap.utils.publicDashboardUtils.updatePublicDashboard({
        token: setup.token,
        id: setup.publicDashboard.id,
        isPublic: true,
      });

      // and when
      const secondResponse = await request(bootstrap.app.getHttpServer()).get(
        `/public_dashboards/${setup.publicDashboard.id}/public_data?period=24h`,
      );

      // then
      expect(secondResponse.status).toBe(200);
    });
  });

  describe('GET /public_dashboards/:publicDashboardId/data', () => {
    it('reads private data', async () => {
      // given
      const setup = await setupPublicDashboard();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/public_dashboards/${setup.publicDashboard.id}/data?period=24h`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      expect(response.status).toBe(200);
    });

    it('denies access for non-cluster member', async () => {
      // given
      const setupA = await setupPublicDashboard();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/public_dashboards/${setupA.publicDashboard.id}/data?period=24h`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toBe(403);
    });
  });
});
