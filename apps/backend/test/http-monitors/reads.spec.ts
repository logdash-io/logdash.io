import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { closeInMemoryMongoServer } from '../utils/mongo-in-memory-server';

describe('HttpMonitorCoreController (reads)', () => {
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

  it('reads cluster monitors', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

    await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setupA.token,
      clusterId: setupA.cluster.id,
      name: 'name 1',
    });
    await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setupA.token,
      clusterId: setupA.cluster.id,
      name: 'name 2',
    });
    await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setupB.token,
      clusterId: setupB.cluster.id,
      name: 'name 1',
    });

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${setupA.cluster.id}/http_monitors`)
      .set('Authorization', `Bearer ${setupA.token}`);

    // then
    expect(response.body).toHaveLength(2);
  });

  it('denies access for non-cluster member', async () => {
    // given
    const { token: creatorToken, cluster } =
      await bootstrap.utils.generalUtils.setupAnonymous();
    const { token: otherUserToken } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${cluster.id}/http_monitors`)
      .set('Authorization', `Bearer ${otherUserToken}`);

    // then
    expect(response.status).toBe(403);
  });
});
