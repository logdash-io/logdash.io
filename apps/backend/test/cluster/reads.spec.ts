import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { ClusterSerialized } from '../../src/cluster/core/entities/cluster.interface';
import { ClusterReadCachedService } from '../../src/cluster/read/cluster-read-cached.service';
import { Types } from 'mongoose';

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

  it('reads user clusters', async () => {
    // given
    const { token, user, cluster, project } =
      await bootstrap.utils.generalUtils.setupAnonymous();

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

  it('counts user created clusters correctly', async () => {
    // given
    const { user } = await bootstrap.utils.generalUtils.setupAnonymous();
    const userId = user.id;
    const clusterReadCachedService = bootstrap.module.get(
      ClusterReadCachedService,
    );

    // Create additional clusters where user is creator
    const additionalClusters = Array.from({ length: 5 }, (_, index) => ({
      _id: new Types.ObjectId(),
      name: `Additional Cluster ${index}`,
      creatorId: userId,
      members: [userId],
      tier: 'Free',
    }));

    await bootstrap.models.clusterModel.insertMany(additionalClusters);

    // Create clusters where user is member but not creator
    const otherUserClusters = Array.from({ length: 3 }, (_, index) => ({
      _id: new Types.ObjectId(),
      name: `Other User Cluster ${index}`,
      creatorId: 'some-other-user-id',
      members: [userId, 'some-other-user-id'],
      tier: 'Free',
    }));

    await bootstrap.models.clusterModel.insertMany(otherUserClusters);

    // when - count should include the cluster created during setupAnonymous + the 5 additional ones
    const count = await clusterReadCachedService.countByCreatorId(userId);

    // then
    expect(count).toBe(6); // 1 from setup + 5 additional

    // Verify cache works
    const cachedCount = await clusterReadCachedService.countByCreatorId(userId);
    expect(cachedCount).toBe(6);
  });
});
