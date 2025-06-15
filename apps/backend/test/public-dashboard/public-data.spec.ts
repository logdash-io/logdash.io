import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { PublicDashboardSerialized } from '../../src/public-dashboard/core/entities/public-dashboard.interface';
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

  async function setupPublicDashboard() {
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

  it('reads public data', async () => {
    // given
    const setup = await setupPublicDashboard();

    // when
    const response = await request(bootstrap.app.getHttpServer()).get(
      `/public-dashboards/${setup.publicDashboard.id}/public-data?period=24h`,
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
      `/public-dashboards/${setup.publicDashboard.id}/public-data?period=24h`,
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
      `/public-dashboards/${setup.publicDashboard.id}/public-data?period=24h`,
    );

    // then
    expect(secondResponse.body).toEqual(data);
  });
});
