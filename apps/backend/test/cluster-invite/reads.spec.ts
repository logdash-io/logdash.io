import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';
import { ClusterTier } from '../../src/cluster/core/enums/cluster-tier.enum';

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
      const { token, user: inviter } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser1 } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser2 } = await bootstrap.utils.generalUtils.setupAnonymous();

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: inviter.id,
        members: [inviter.id],
        tier: ClusterTier.Free,
      });

      await bootstrap.models.clusterInviteModel.create({
        _id: new Types.ObjectId(),
        inviterUserId: inviter.id,
        invitedUserId: invitedUser1.id,
        clusterId: cluster._id.toString(),
      });

      await bootstrap.models.clusterInviteModel.create({
        _id: new Types.ObjectId(),
        inviterUserId: inviter.id,
        invitedUserId: invitedUser2.id,
        clusterId: cluster._id.toString(),
      });

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster._id.toString()}/cluster_invites`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].clusterId).toBe(cluster._id.toString());
      expect(response.body[1].clusterId).toBe(cluster._id.toString());
    });

    it('returns empty array when no invites exist for cluster', async () => {
      const { token, user: inviter } = await bootstrap.utils.generalUtils.setupAnonymous();

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: inviter.id,
        members: [inviter.id],
        tier: ClusterTier.Free,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster._id.toString()}/cluster_invites`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /users/me/cluster_invites', () => {
    it('returns invites for the current user', async () => {
      const { user: inviter } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      const cluster1 = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster 1',
        creatorId: inviter.id,
        members: [inviter.id],
        tier: ClusterTier.Free,
      });

      const cluster2 = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster 2',
        creatorId: inviter.id,
        members: [inviter.id],
        tier: ClusterTier.Free,
      });

      await bootstrap.models.clusterInviteModel.create({
        _id: new Types.ObjectId(),
        inviterUserId: inviter.id,
        invitedUserId: invitedUser.id,
        clusterId: cluster1._id.toString(),
      });

      await bootstrap.models.clusterInviteModel.create({
        _id: new Types.ObjectId(),
        inviterUserId: inviter.id,
        invitedUserId: invitedUser.id,
        clusterId: cluster2._id.toString(),
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
