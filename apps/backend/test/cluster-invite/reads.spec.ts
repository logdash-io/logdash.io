import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { ClusterRole } from '../../src/cluster/core/enums/cluster-role.enum';

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
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
      const { user: invitedUser1 } = await bootstrap.utils.generalUtils.setupClaimed();
      const { user: invitedUser2 } = await bootstrap.utils.generalUtils.setupClaimed();

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token,
        clusterId: cluster.id,
        invitedUserEmail: invitedUser1.email,
      });

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token,
        clusterId: cluster.id,
        invitedUserEmail: invitedUser2.email,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].clusterId).toBe(cluster.id);
      expect(response.body[0].invitedUserEmail).toBe(invitedUser1.email);
      expect(response.body[0].invitedUserId).toBeUndefined();
      expect(response.body[1].clusterId).toBe(cluster.id);
      expect(response.body[1].invitedUserEmail).toBe(invitedUser2.email);
      expect(response.body[1].invitedUserId).toBeUndefined();
    });

    it('returns empty array when no invites exist for cluster', async () => {
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed();

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('returns 403 when user is not a member of the cluster', async () => {
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupClaimed();

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /users/me/cluster_invites', () => {
    it('returns invites for the current user', async () => {
      const { token: inviterToken, cluster: cluster1 } =
        await bootstrap.utils.generalUtils.setupClaimed({
          email: 'admin1@example.com',
          userTier: UserTier.Admin,
        });

      const { token: inviterToken2, cluster: cluster2 } =
        await bootstrap.utils.generalUtils.setupClaimed({
          email: 'admin2@example.com',
          userTier: UserTier.Admin,
        });

      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupClaimed();

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster1.id,
        invitedUserEmail: invitedUser.email,
      });

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken2,
        clusterId: cluster2.id,
        invitedUserEmail: invitedUser.email,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .get('/users/me/cluster_invites')
        .set('Authorization', `Bearer ${invitedUserToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].invitedUserEmail).toBe(invitedUser.email);
      expect(response.body[0].invitedUserId).toBeUndefined();
      expect(response.body[1].invitedUserEmail).toBe(invitedUser.email);
      expect(response.body[1].invitedUserId).toBeUndefined();
    });

    it('returns empty array when user has no invites', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupClaimed();

      const response = await request(bootstrap.app.getHttpServer())
        .get('/users/me/cluster_invites')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /clusters/:clusterId/cluster_invites/capacity', () => {
    it('returns capacity for default cluster', async () => {
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.EarlyBird,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/cluster_invites/capacity`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.maxMembers).toBe(2);
      expect(response.body.currentUsersCount).toBe(1);
      expect(response.body.currentInvitesCount).toBe(0);
    });

    it('returns capacity for cluster with members', async () => {
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.EarlyBird,
      });

      const otherSetup = await bootstrap.utils.generalUtils.setupClaimed();

      await bootstrap.utils.projectGroupUtils.addRole({
        clusterId: cluster.id,
        userId: otherSetup.user.id,
        role: ClusterRole.Write,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/cluster_invites/capacity`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.maxMembers).toBe(2);
      expect(response.body.currentUsersCount).toBe(2);
      expect(response.body.currentInvitesCount).toBe(0);
    });

    it('returns capacity for cluster with invites', async () => {
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.EarlyBird,
      });

      const otherSetup = await bootstrap.utils.generalUtils.setupClaimed();

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token,
        clusterId: cluster.id,
        invitedUserEmail: otherSetup.user.email,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/cluster_invites/capacity`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.maxMembers).toBe(2);
      expect(response.body.currentUsersCount).toBe(1);
      expect(response.body.currentInvitesCount).toBe(1);
    });
  });
});
