import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';
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
      const {
        token: inviterToken,
        user: inviter,
        cluster,
      } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: invitedUser.id,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.inviterUserId).toBe(inviter.id);
      expect(response.body.invitedUserId).toBe(invitedUser.id);
      expect(response.body.clusterId).toBe(cluster.id);

      const entity = await bootstrap.models.clusterInviteModel.findOne({
        inviterUserId: inviter.id,
        invitedUserId: invitedUser.id,
        clusterId: cluster.id,
      });

      expect(entity).toBeTruthy();
    });

    it('throws error when invited user does not exist', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const nonExistentUserId = new Types.ObjectId().toString();

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: nonExistentUserId,
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('throws error when user is already invited to cluster', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster.id,
        invitedUserId: invitedUser.id,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: invitedUser.id,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('User is already invited to this cluster');
    });

    it('creates audit log when invite is created', async () => {
      const {
        token: inviterToken,
        user: inviter,
        cluster,
      } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
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

    it('returns 403 when user is not a member of the cluster', async () => {
      const { cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          invitedUserId: invitedUser.id,
        });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PATCH /cluster_invites/:inviteId/accept', () => {
    it('validates invite ownership', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: unauthorizedToken } = await bootstrap.utils.generalUtils.setupAnonymous();

      const invite = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster.id,
        invitedUserId: invitedUser.id,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .patch(`/cluster_invites/${invite.id}/accept`)
        .set('Authorization', `Bearer ${unauthorizedToken}`);

      expect(response.body.message).toBe('You can only accept invites sent to you');
    });

    it('throws error when invite does not exist', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const nonExistentInviteId = new Types.ObjectId().toString();

      const response = await request(bootstrap.app.getHttpServer())
        .patch(`/cluster_invites/${nonExistentInviteId}/accept`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.message).toBe('Invite not found');
    });

    it('accepts invite successfully (placeholder implementation)', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      const invite = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster.id,
        invitedUserId: invitedUser.id,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .patch(`/cluster_invites/${invite.id}/accept`)
        .set('Authorization', `Bearer ${invitedUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
