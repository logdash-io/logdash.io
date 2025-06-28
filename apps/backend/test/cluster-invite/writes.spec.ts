import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';
import { ClusterTier } from '../../src/cluster/core/enums/cluster-tier.enum';
import { AuditLogEntityAction } from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../src/audit-log/core/enums/related-domain.enum';

describe('ClusterInviteCoreController (writes)', () => {
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

  describe('POST /clusters/:clusterId/cluster_invites', () => {
    it('creates new cluster invite', async () => {
      const { token: inviterToken, user: inviter } =
        await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: inviter.id,
        members: [inviter.id],
        tier: ClusterTier.Free,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster._id.toString()}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: invitedUser.id,
        })
        .expect(201);

      expect(response.body.inviterUserId).toBe(inviter.id);
      expect(response.body.invitedUserId).toBe(invitedUser.id);
      expect(response.body.clusterId).toBe(cluster._id.toString());

      const entity = await bootstrap.models.clusterInviteModel.findOne({
        inviterUserId: inviter.id,
        invitedUserId: invitedUser.id,
        clusterId: cluster._id.toString(),
      });

      expect(entity).toBeTruthy();
    });

    it('throws error when invited user does not exist', async () => {
      const { token: inviterToken } = await bootstrap.utils.generalUtils.setupAnonymous();
      const nonExistentUserId = new Types.ObjectId().toString();

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: 'some-creator-id',
        members: ['some-creator-id'],
        tier: ClusterTier.Free,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster._id.toString()}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: nonExistentUserId,
        })
        .expect(404);

      expect(response.body.message).toBe('Invited user not found');
    });

    it('throws error when user is already invited to cluster', async () => {
      const { token: inviterToken, user: inviter } =
        await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();

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
        invitedUserId: invitedUser.id,
        clusterId: cluster._id.toString(),
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster._id.toString()}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: invitedUser.id,
        })
        .expect(400);

      expect(response.body.message).toBe('User is already invited to this cluster');
    });

    it('creates audit log when invite is created', async () => {
      const { token: inviterToken, user: inviter } =
        await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: inviter.id,
        members: [inviter.id],
        tier: ClusterTier.Free,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster._id.toString()}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: invitedUser.id,
        });

      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: inviter.id,
        action: AuditLogEntityAction.Create,
        relatedDomain: RelatedDomain.Cluster,
        relatedEntityId: response.body.id,
      });
    });
  });

  describe('PATCH /cluster_invites/:inviteId/accept', () => {
    it('validates invite ownership', async () => {
      const { user: inviter } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: unauthorizedToken } = await bootstrap.utils.generalUtils.setupAnonymous();

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: inviter.id,
        members: [inviter.id],
        tier: ClusterTier.Free,
      });

      const invite = await bootstrap.models.clusterInviteModel.create({
        _id: new Types.ObjectId(),
        inviterUserId: inviter.id,
        invitedUserId: invitedUser.id,
        clusterId: cluster._id.toString(),
      });

      const response = await request(bootstrap.app.getHttpServer())
        .patch(`/cluster_invites/${invite._id.toString()}/accept`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(400);

      expect(response.body.message).toBe('You can only accept invites sent to you');
    });

    it('throws error when invite does not exist', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const nonExistentInviteId = new Types.ObjectId().toString();

      const response = await request(bootstrap.app.getHttpServer())
        .patch(`/cluster_invites/${nonExistentInviteId}/accept`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Invite not found');
    });

    it('accepts invite successfully (placeholder implementation)', async () => {
      const { user: inviter } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: inviter.id,
        members: [inviter.id],
        tier: ClusterTier.Free,
      });

      const invite = await bootstrap.models.clusterInviteModel.create({
        _id: new Types.ObjectId(),
        inviterUserId: inviter.id,
        invitedUserId: invitedUser.id,
        clusterId: cluster._id.toString(),
      });

      const response = await request(bootstrap.app.getHttpServer())
        .patch(`/cluster_invites/${invite._id.toString()}/accept`)
        .set('Authorization', `Bearer ${invitedUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
