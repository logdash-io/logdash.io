import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { ClusterSerialized } from '../../src/cluster/core/entities/cluster.interface';

describe('ClusterCoreController (reads)', () => {
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

  describe('GET /users/me/clusters', () => {
    it('reads user clusters', async () => {
      // given
      const { token, user, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/users/me/clusters`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const clusterSerialized: ClusterSerialized = response.body[0];

      expect(clusterSerialized.creatorId).toEqual(user.id);
      expect(clusterSerialized.projects?.[0].id).toEqual(project.id);
      expect(clusterSerialized.features).toEqual([]);
    });

    it('adds projects and public dashboards to the response', async () => {
      // given
      const { token, cluster, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'first dashboard',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/users/me/clusters`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const clusterSerialized: ClusterSerialized = response.body[0];

      expect(clusterSerialized.publicDashboards?.[0].id).toEqual(publicDashboard.id);
      expect(clusterSerialized.publicDashboards?.[0].name).toEqual(publicDashboard.name);
      expect(clusterSerialized.publicDashboards?.[0].isPublic).toEqual(publicDashboard.isPublic);

      expect(clusterSerialized.projects?.[0].id).toEqual(project.id);
      expect(clusterSerialized.projects?.[0].name).toEqual(project.name);
    });
  });
});
