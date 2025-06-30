import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { ClusterSerialized } from '../../src/cluster/core/entities/cluster.interface';
import { ClusterRole } from '../../src/cluster/core/enums/cluster-role.enum';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

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

    it('reads clusters where user has write role', async () => {
      const setup = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Admin,
      });
      const otherSetup = await bootstrap.utils.generalUtils.setupClaimed();

      await bootstrap.utils.projectGroupUtils.addRole({
        clusterId: setup.cluster.id,
        userId: otherSetup.user.id,
        role: ClusterRole.Write,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/users/me/clusters`)
        .set('Authorization', `Bearer ${otherSetup.token}`);

      // then
      const clusterSerialized: ClusterSerialized = response.body[0];

      expect(clusterSerialized.id).toEqual(setup.cluster.id);
      expect(clusterSerialized.projects?.[0].id).toEqual(setup.project.id);
      expect(clusterSerialized.projects?.[0].name).toEqual(setup.project.name);
    });
  });
});
