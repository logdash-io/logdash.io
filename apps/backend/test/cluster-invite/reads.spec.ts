import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';

describe('ClusterInviteCoreController (reads)', () => {
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

  describe('GET /clusters/:clusterId/cluster_invites', () => {
    it('returns invites for a cluster', async () => {
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser1 } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser2 } = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token,
        clusterId: cluster.id,
        invitedUserId: invitedUser1.id,
      });

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token,
        clusterId: cluster.id,
        invitedUserId: invitedUser2.id,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].clusterId).toBe(cluster.id);
      expect(response.body[1].clusterId).toBe(cluster.id);
    });

    it('returns empty array when no invites exist for cluster', async () => {
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('returns 403 when user is not a member of the cluster', async () => {
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /users/me/cluster_invites', () => {
    it('returns invites for the current user', async () => {
      const { token: inviterToken, cluster: cluster1 } =
        await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: inviterToken2, cluster: cluster2 } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster1.id,
        invitedUserId: invitedUser.id,
      });

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken2,
        clusterId: cluster2.id,
        invitedUserId: invitedUser.id,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .get('/users/me/cluster_invites')
        .set('Authorization', `Bearer ${invitedUserToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].invitedUserId).toBe(invitedUser.id);
      expect(response.body[1].invitedUserId).toBe(invitedUser.id);
    });

    it('returns empty array when user has no invites', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .get('/users/me/cluster_invites')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });
});
