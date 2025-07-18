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
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'invited@example.com',
        userTier: UserTier.Free,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          email: invitedUser.email,
          role: ClusterRole.Write,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.inviterUserId).toBe(inviter.id);
      expect(response.body.invitedUserEmail).toBe(invitedUser.email);
      expect(response.body.clusterId).toBe(cluster.id);
      expect(response.body.clusterName).toBe(cluster.name);
      expect(response.body.invitedUserId).toBeUndefined();

      const entity = (await bootstrap.models.clusterInviteModel.findOne())!;

      const invite = ClusterInviteSerializer.normalize(entity);

      expect(invite).toMatchObject({
        inviterUserId: inviter.id,
        invitedUserEmail: invitedUser.email,
        clusterId: cluster.id,
        role: ClusterRole.Write,
      });
    });

    it('lets non existent user be invited', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          email: 'nonexistent@example.com',
          role: ClusterRole.Write,
        });

      const nonexistentSetup = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'nonexistent@example.com',
      });

      const response2 = await request(bootstrap.app.getHttpServer())
        .get(`/users/me/cluster_invites`)
        .set('Authorization', `Bearer ${nonexistentSetup.token}`);

      expect(response2.body).toHaveLength(1);
      expect(response2.body[0].invitedUserEmail).toBe('nonexistent@example.com');
      expect(response2.body[0].clusterId).toBe(cluster.id);
      expect(response2.body[0].clusterName).toBe(cluster.name);
      expect(response2.body[0].role).toBe(ClusterRole.Write);
    });

    it('throws error when user is already invited to cluster', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'invited@example.com',
        userTier: UserTier.Free,
      });

      await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster.id,
        invitedUserEmail: invitedUser.email,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          email: invitedUser.email,
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
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'invited@example.com',
        userTier: UserTier.Free,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${inviterToken}`)
        .send({
          email: invitedUser.email,
          role: ClusterRole.Write,
        });

      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: inviter.id,
        action: AuditLogClusterAction.InvitedUser,
        relatedDomain: RelatedDomain.Cluster,
        relatedEntityId: response.body.id,
      });
    });

    it('throws 403 error when user is does not have the required role', async () => {
      const { cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const otherSetup = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.projectGroupUtils.addRole({
        clusterId: cluster.id,
        role: ClusterRole.Write,
        userId: otherSetup.user.id,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${otherSetup.token}`)
        .send({
          email: otherSetup.user.email,
          role: ClusterRole.Write,
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('User does not have the required role');
    });

    describe('Max capacity', () => {
      it('throws error when cluster is at max capacity (FREE)', async () => {
        const setup = await bootstrap.utils.generalUtils.setupClaimed({
          email: 'admin@example.com',
          userTier: UserTier.Free,
        });

        const otherSetup = await bootstrap.utils.generalUtils.setupClaimed({
          email: 'other@example.com',
          userTier: UserTier.Free,
        });

        await bootstrap.utils.projectGroupUtils.addRole({
          clusterId: setup.cluster.id,
          userId: otherSetup.user.id,
          role: ClusterRole.Write,
        });

        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${setup.cluster.id}/cluster_invites`)
          .set('Authorization', `Bearer ${setup.token}`)
          .send({
            email: setup.user.email,
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

        const otherSetup2 = await bootstrap.utils.generalUtils.setupClaimed({
          email: 'other2@example.com',
          userTier: UserTier.EarlyBird,
        });

        const artificialRole = await bootstrap.utils.projectGroupUtils.addRole({
          clusterId: setup.cluster.id,
          userId: otherSetup.user.id,
          role: ClusterRole.Write,
        });

        const artificialRole2 = await bootstrap.utils.projectGroupUtils.addRole({
          clusterId: setup.cluster.id,
          userId: otherSetup2.user.id,
          role: ClusterRole.Write,
        });

        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${setup.cluster.id}/cluster_invites`)
          .set('Authorization', `Bearer ${setup.token}`)
          .send({
            email: otherSetup.user.email,
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

        const invitedSetup = await bootstrap.utils.generalUtils.setupClaimed();
        const invitedSetup2 = await bootstrap.utils.generalUtils.setupClaimed();

        const toInviteSetup = await bootstrap.utils.generalUtils.setupClaimed();

        const invite = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
          token: setup.token,
          clusterId: setup.cluster.id,
          invitedUserEmail: invitedSetup.user.email,
        });
        const invite2 = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
          token: setup.token,
          clusterId: setup.cluster.id,
          invitedUserEmail: invitedSetup2.user.email,
        });

        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${setup.cluster.id}/cluster_invites`)
          .set('Authorization', `Bearer ${setup.token}`)
          .send({
            email: toInviteSetup.user.email,
            role: ClusterRole.Write,
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Cluster is at capacity');
      });
    });

    it('returns 403 when user is not a member of the cluster', async () => {
      const { cluster } = await bootstrap.utils.generalUtils.setupClaimed();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupClaimed();
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupClaimed();

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/cluster_invites`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          email: invitedUser.email,
          role: ClusterRole.Write,
        });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /cluster_invites/:inviteId/accept', () => {
    it('validates invite ownership', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
      const { user: invitedUser } = await bootstrap.utils.generalUtils.setupClaimed();
      const { token: unauthorizedToken } = await bootstrap.utils.generalUtils.setupClaimed();

      const invite = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster.id,
        invitedUserEmail: invitedUser.email,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .put(`/cluster_invites/${invite.id}/accept`)
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
        .put(`/cluster_invites/${nonExistentInviteId}/accept`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.message).toBe('Invite not found');
    });

    it('accepts invite successfully', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupClaimed();

      const invite = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster.id,
        invitedUserEmail: invitedUser.email,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .put(`/cluster_invites/${invite.id}/accept`)
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

    it('throws error when user is a member of too many clusters', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });

      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupClaimed();

      for (let i = 0; i < 4; i++) {
        await bootstrap.utils.projectGroupUtils.createProjectGroup({
          token: invitedUserToken,
        });
      }

      const invite = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster.id,
        invitedUserEmail: invitedUser.email,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .put(`/cluster_invites/${invite.id}/accept`)
        .set('Authorization', `Bearer ${invitedUserToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('You are a member of too many clusters');
    });
  });

  describe('DELETE /cluster_invites/:inviteId', () => {
    it('deletes invite', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });

      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupClaimed();

      const invite = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster.id,
        invitedUserEmail: invitedUser.email,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/cluster_invites/${invite.id}`)
        .set('Authorization', `Bearer ${inviterToken}`);

      expect(response.statusCode).toBe(200);

      const invites = await bootstrap.models.clusterInviteModel.find({});
      expect(invites.length).toBe(0);
    });

    it('throws error when user other than inviter or invited tries to delete invite', async () => {
      const { token: inviterToken, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'admin@example.com',
        userTier: UserTier.Admin,
      });
      const { token: invitedUserToken, user: invitedUser } =
        await bootstrap.utils.generalUtils.setupClaimed();

      const otherSetup = await bootstrap.utils.generalUtils.setupClaimed();

      const invite = await bootstrap.utils.clusterInviteUtils.createClusterInvite({
        token: inviterToken,
        clusterId: cluster.id,
        invitedUserEmail: invitedUser.email,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/cluster_invites/${invite.id}`)
        .set('Authorization', `Bearer ${otherSetup.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('You can only delete invites you have sent or received');
    });
  });
});
