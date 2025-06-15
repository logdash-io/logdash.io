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

  describe('GET /clusters/:clusterId/public-dashboards', () => {
    it('reads public dashboards by cluster id', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/public-dashboards`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      console.log(await bootstrap.models.publicDashboardModel.find());

      // then
      const dashboards: PublicDashboardSerialized[] = response.body;
      expect(dashboards).toHaveLength(1);

      expect(dashboards[0].clusterId).toBe(cluster.id);
      expect(dashboards[0].httpMonitorsIds).toEqual([]);
    });

    it('returns empty array when no public dashboards exist for cluster', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clusterId = cluster.id;

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${clusterId}/public-dashboards`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

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
        .get(`/clusters/${setupA.cluster.id}/public-dashboards`)
        .set('Authorization', `Bearer ${setupB.token}`)
        .expect(403);

      // then
      expect(response.status).toEqual(403);
    });
  });
});
