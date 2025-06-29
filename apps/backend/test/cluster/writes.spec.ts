import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';
import { ClusterTier } from '../../src/cluster/core/enums/cluster-tier.enum';
import {
  AuditLogClusterAction,
  AuditLogEntityAction,
  AuditLogUserAction,
} from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../src/audit-log/core/enums/related-domain.enum';
import { ClusterRole } from '../../src/cluster/core/enums/cluster-role.enum';

describe('ClusterCoreController (writes)', () => {
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

  describe('POST /users/me/clusters', () => {
    it('creates new cluster', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/users/me/clusters`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my cluster' });

      // then
      const entity = await bootstrap.models.clusterModel.findOne({
        name: 'my cluster',
      });

      expect(entity?.name).toBe('my cluster');
    });

    it('throws error when user tries to create more than 5 clusters', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const userId = user.id;

      // create 4 clusters (5th is created in the setup)
      const clusters = Array.from({ length: 4 }, (_, index) => ({
        _id: new Types.ObjectId(),
        name: `Cluster ${index}`,
        creatorId: userId,
        members: [userId],
        tier: ClusterTier.Free,
      }));

      await bootstrap.models.clusterModel.insertMany(clusters);

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/users/me/clusters`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'one cluster too many' })
        .expect(400);

      // then
      expect(response.body.message).toBe('Cannot create more clusters. Maximum limit reached.');

      // Verify no new cluster was created
      const clusterCount = await bootstrap.models.clusterModel.countDocuments({
        creatorId: userId,
      });

      expect(clusterCount).toBe(5);
    });

    it('creates audit log when cluster is created', async () => {
      // given
      const { user, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/users/me/clusters`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name' });

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Create,
        relatedDomain: RelatedDomain.Cluster,
        relatedEntityId: response.body.id,
      });
    });

    it('creates cluster with creator role', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/users/me/clusters`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name' });

      // then
      expect(response.body.roles).toEqual({ [user.id]: ClusterRole.Creator });
    });
  });

  describe('PUT /clusters/:clusterId', () => {
    it('updates cluster name', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const userId = user.id;

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Original Cluster Name',
        creatorId: userId,
        members: [userId],
        tier: ClusterTier.Free,
      });

      const clusterId = cluster._id.toString();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/clusters/${clusterId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Cluster Name' })
        .expect(200);

      // then
      expect(response.body.name).toBe('Updated Cluster Name');

      const updatedCluster = await bootstrap.models.clusterModel.findById(clusterId);
      expect(updatedCluster?.name).toBe('Updated Cluster Name');
    });

    it('creates audit log when cluster is updated', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const userId = user.id;

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Original Cluster Name',
        creatorId: userId,
        members: [userId],
        tier: ClusterTier.Free,
      });

      const clusterId = cluster._id.toString();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/clusters/${clusterId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Cluster Name' });

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Update,
        relatedDomain: RelatedDomain.Cluster,
        relatedEntityId: clusterId,
      });
    });

    it('throws error when user is not a member of the cluster', async () => {
      // given
      const { user: creator } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: nonMemberToken, user: nonMember } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      // Create a cluster with creator only
      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: creator.id,
        members: [creator.id], // Only creator is a member
        tier: ClusterTier.Free,
      });

      const clusterId = cluster._id.toString();

      // when & then
      await request(bootstrap.app.getHttpServer())
        .put(`/clusters/${clusterId}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({ name: 'Attempted Name Change' })
        .expect(403); // Forbidden due to ClusterMemberGuard

      // Verify name wasn't changed
      const unchangedCluster = await bootstrap.models.clusterModel.findById(clusterId);
      expect(unchangedCluster?.name).toBe('Test Cluster');
    });
  });

  describe('DELETE /clusters/:clusterId', () => {
    it('deletes cluster and connected projects and public dashboards', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const userId = user.id;

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: userId,
        members: [userId],
        tier: ClusterTier.Free,
      });

      const project = await bootstrap.utils.projectUtils.createDefaultProject({
        clusterId: cluster._id.toString(),
      });

      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: project.id,
        token,
      });
      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster._id.toString(),
        httpMonitorsIds: [monitor.id],
        token,
      });

      const projectsBeforeRemoval = await bootstrap.models.projectModel.find({
        clusterId: cluster._id.toString(),
      });

      const publicDashboardsBeforeRemoval = await bootstrap.models.publicDashboardModel.find({
        clusterId: cluster._id.toString(),
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/clusters/${cluster._id.toString()}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toEqual(200);

      const projectsAfterRemoval = await bootstrap.models.projectModel.find({
        clusterId: cluster._id.toString(),
      });

      const clustersAfterRemoval = await bootstrap.models.clusterModel.find({
        _id: new Types.ObjectId(cluster._id.toString()),
      });

      const publicDashboardsAfterRemoval = await bootstrap.models.publicDashboardModel.find({
        clusterId: cluster._id.toString(),
      });

      expect(projectsBeforeRemoval).toHaveLength(1);
      expect(publicDashboardsBeforeRemoval).toHaveLength(1);

      expect(projectsAfterRemoval).toHaveLength(0);
      expect(clustersAfterRemoval).toHaveLength(0);
      expect(publicDashboardsAfterRemoval).toHaveLength(0);
    });

    it('creates audit log when cluster is deleted', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const userId = user.id;

      const cluster = await bootstrap.models.clusterModel.create({
        _id: new Types.ObjectId(),
        name: 'Test Cluster',
        creatorId: userId,
        members: [userId],
        tier: ClusterTier.Free,
      });

      const clusterId = cluster._id.toString();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/clusters/${clusterId}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Delete,
        relatedDomain: RelatedDomain.Cluster,
        relatedEntityId: clusterId,
      });
    });

    it('throws 403 error when user is not a member of the cluster', async () => {
      // given
      const { user: creator, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: nonMemberToken, user: nonMember } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      // when & then
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/clusters/${cluster.id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);

      // then
      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('User is not a member of this cluster');
    });

    it('throws 403 error when user is member of the cluster but does not have the required role', async () => {
      // given
      const { user: creator, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: nonMemberToken, user: nonMember } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.projectGroupUtils.addRole({
        clusterId: cluster.id,
        userId: nonMember.id,
        role: ClusterRole.Write,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/clusters/${cluster.id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      // then
      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('User does not have the required role');
    });
  });

  describe('DELETE /clusters/:clusterId/roles/:userId', () => {
    it('deletes role from cluster', async () => {
      // given
      const { token, user, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const otherSetup = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.projectGroupUtils.addRole({
        clusterId: cluster.id,
        role: ClusterRole.Write,
        userId: otherSetup.user.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/clusters/${cluster.id}/roles/${otherSetup.user.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const clusterAfterRemoval = await bootstrap.models.clusterModel.findById(cluster.id);
      expect(clusterAfterRemoval?.roles[otherSetup.user.id]).toBeUndefined();

      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogClusterAction.RevokedRole,
        relatedDomain: RelatedDomain.Cluster,
        relatedEntityId: cluster.id,
      });

      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: otherSetup.user.id,
        action: AuditLogUserAction.RevokedRoleFromCluster,
        relatedDomain: RelatedDomain.User,
        relatedEntityId: cluster.id,
      });
    });

    it('throws error when creator tries to delete his role', async () => {
      // given
      const { token, user, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/clusters/${cluster.id}/roles/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Cannot delete role. User is the creator of this cluster.',
      );
    });

    it('throws 403 error when user does not have the required role', async () => {
      // given
      const { cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const otherSetup = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.projectGroupUtils.addRole({
        clusterId: cluster.id,
        role: ClusterRole.Write,
        userId: otherSetup.user.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/clusters/${cluster.id}/roles/${otherSetup.user.id}`)
        .set('Authorization', `Bearer ${otherSetup.token}`);

      // then
      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('User does not have the required role');
    });
  });
});
