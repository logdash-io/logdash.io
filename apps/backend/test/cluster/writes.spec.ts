import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';
import { ClusterTier } from '../../src/cluster/core/enums/cluster-tier.enum';

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

  describe('POST /users/me/clusters - create cluster', () => {
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

    it('throws error when user tries to create more than 100 clusters', async () => {
      // given
      const { token, user } =
        await bootstrap.utils.generalUtils.setupAnonymous();
      const userId = user.id;

      // create 99 clusters (100th is created in the setup)
      const clusters = Array.from({ length: 99 }, (_, index) => ({
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
      expect(response.body.message).toBe(
        'Cannot create more clusters. Maximum limit of 100 clusters per user has been reached.',
      );

      // Verify no new cluster was created
      const clusterCount = await bootstrap.models.clusterModel.countDocuments({
        creatorId: userId,
      });

      expect(clusterCount).toBe(100);
    });
  });

  describe('PUT /clusters/:clusterId - update cluster', () => {
    it('updates cluster name', async () => {
      // given
      const { token, user } =
        await bootstrap.utils.generalUtils.setupAnonymous();
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

      const updatedCluster =
        await bootstrap.models.clusterModel.findById(clusterId);
      expect(updatedCluster?.name).toBe('Updated Cluster Name');
    });

    it('throws error when user is not a member of the cluster', async () => {
      // given
      const { user: creator } =
        await bootstrap.utils.generalUtils.setupAnonymous();
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
      const unchangedCluster =
        await bootstrap.models.clusterModel.findById(clusterId);
      expect(unchangedCluster?.name).toBe('Test Cluster');
    });
  });
});
