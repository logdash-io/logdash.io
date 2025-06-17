import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { PublicDashboardSerialized } from '../../src/public-dashboard/core/entities/public-dashboard.interface';

describe('PublicDashboardCoreController (reads)', () => {
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

  describe('GET /clusters/:clusterId/public_dashboards', () => {
    it('reads public dashboards by cluster id', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'piety papieza',
        isPublic: true,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/public_dashboards`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const dashboards: PublicDashboardSerialized[] = response.body;
      expect(dashboards).toHaveLength(1);

      expect(dashboards[0].clusterId).toBe(cluster.id);
      expect(dashboards[0].httpMonitorsIds).toEqual([]);
      expect(dashboards[0].name).toEqual('piety papieza');
      expect(dashboards[0].isPublic).toEqual(true);
    });

    it('returns empty array when no public dashboards exist for cluster', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clusterId = cluster.id;

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${clusterId}/public_dashboards`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.body).toEqual([]);
    });

    it('throws 403 when user is not a member of the cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: setupA.cluster.id,
        token: setupA.token,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${setupA.cluster.id}/public_dashboards`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toEqual(403);
    });
  });
});
