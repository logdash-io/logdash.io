import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';
import {
  AuditLogClusterAction,
  AuditLogUserAction,
} from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../src/audit-log/core/enums/related-domain.enum';
import { ClusterRole } from '../../src/cluster/core/enums/cluster-role.enum';
import { ClusterInviteSerializer } from '../../src/cluster-invite/core/entities/cluster-invite.serializer';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

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
      } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: invitedUser.id,
          role: ClusterRole.Write,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.inviterUserId).toBe(inviter.id);
      expect(response.body.invitedUserId).toBe(invitedUser.id);
      expect(response.body.clusterId).toBe(cluster.id);

      const entity = (await bootstrap.models.clusterInviteModel.findOne())!;

      const invite = ClusterInviteSerializer.normalize(entity);

      expect(invite).toMatchObject({
        inviterUserId: inviter.id,
        invitedUserId: invitedUser.id,
        clusterId: cluster.id,
        role: ClusterRole.Write,
      });
    });

    it('throws error when invited user does not exist', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
      const nonExistentUserId = new Types.ObjectId().toString();

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: nonExistentUserId,
          role: ClusterRole.Write,
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('throws error when user is already invited to cluster', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
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
          role: ClusterRole.Write,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('User is already invited to this cluster');
    });

    it('creates audit log when invite is created', async () => {
      const {
        token: inviterToken,
        user: inviter,
        cluster,
      } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          invitedUserId: invitedUser.id,
          role: ClusterRole.Write,
        });

      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: inviter.id,
        action: AuditLogClusterAction.InvitedUser,
        relatedDomain: RelatedDomain.Cluster,
        relatedEntityId: response.body.id,
      });

      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: invitedUser.id,
        action: AuditLogUserAction.GotInvitedToCluster,
        relatedDomain: RelatedDomain.User,
        relatedEntityId: invitedUser.id,
      });
    });

    describe('Max capacity', () => {
      it('throws error when cluster is at max capacity (FREE)', async () => {
        const setup = await bootstrap.utils.generalUtils.setupClaimed({
          email: 'admin@example.com',
          userTier: UserTier.Free,
        });

        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${setup.cluster.id}/cluster_invites`)
          .set('Authorization', `Bearer ${setup.token}`)
          .send({
            invitedUserId: setup.user.id,
            role: ClusterRole.Write,
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Cluster is at capacity');
      });

      it('throws error when cluster is at max capacity (EARLY BIRD - MEMBERS)', async () => {
        const setup = await bootstrap.utils.generalUtils.setupClaimed({
          email: 'admin@example.com',
          userTier: UserTier.EarlyBird,
        });

        const otherSetup = await bootstrap.utils.generalUtils.setupClaimed({
          email: 'other@example.com',
          userTier: UserTier.EarlyBird,
        });

        const artificialRole = await bootstrap.utils.projectGroupUtils.addRole({
          clusterId: setup.cluster.id,
          userId: otherSetup.user.id,
          role: ClusterRole.Write,
        });

        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${setup.cluster.id}/cluster_invites`)
          .set('Authorization', `Bearer ${setup.token}`)
          .send({
            invitedUserId: otherSetup.user.id,
            role: ClusterRole.Write,
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Cluster is at capacity');
      });

      it('throws error when cluster is at max capacity (EARLY BIRD - INVITES)', async () => {
        const setup = await bootstrap.utils.generalUtils.setupClaimed({
          email: 'admin@example.com',
          userTier: UserTier.EarlyBird,
        });

        const invitedSetup = await bootstrap.utils.generalUtils.setupAnonymous();

        const toInviteSetup = await bootstrap.utils.generalUtils.setupAnonymous();

        const invite = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
          token: setup.token,
          clusterId: setup.cluster.id,
          invitedUserId: invitedSetup.user.id,
        });

        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${setup.cluster.id}/cluster_invites`)
          .set('Authorization', `Bearer ${setup.token}`)
          .send({
            invitedUserId: toInviteSetup.user.id,
            role: ClusterRole.Write,
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Cluster is at capacity');
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
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
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
      const { token } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
      const nonExistentInviteId = new Types.ObjectId().toString();

      const response = await request(bootstrap.app.getHttpServer())
        .patch(`/cluster_invites/${nonExistentInviteId}/accept`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.message).toBe('Invite not found');
    });

    it('accepts invite successfully', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
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

      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: invitedUser.id,
        action: AuditLogUserAction.AcceptedInviteToCluster,
        relatedDomain: RelatedDomain.User,
        relatedEntityId: cluster.id,
      });

      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: invitedUser.id,
        action: AuditLogClusterAction.AcceptedInvite,
        relatedDomain: RelatedDomain.Cluster,
        relatedEntityId: cluster.id,
      });

      const updatedCluster = await bootstrap.models.clusterModel.findById(cluster.id);
      expect(updatedCluster?.roles[invitedUser.id]).toBe(ClusterRole.Write);
    });
  });
});
