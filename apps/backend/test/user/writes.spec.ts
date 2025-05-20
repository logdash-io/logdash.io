import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { closeInMemoryMongoServer } from '../utils/mongo-in-memory-server';

describe('UserCoreController (writes)', () => {
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

  it('creates anonymous user with cluster', async () => {
    // when
    const response = await request(bootstrap.app.getHttpServer()).post(
      '/users/anonymous',
    );

    const cluster = (await bootstrap.models.clusterModel.findOne())!;

    // then
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toBeDefined();
    expect(response.body.cluster.creatorId).toBe(response.body.user.id);
  });
});
