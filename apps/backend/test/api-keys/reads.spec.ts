import { createTestApp } from '../utils/bootstrap';
import * as request from 'supertest';

describe('Api keys (reads)', () => {
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

  it('returns project api keys for user who is a member of cluster', async () => {
    // given
    const { project, token } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/projects/${project.id}/api_keys`)
      .set('Authorization', `Bearer ${token}`);

    // then
    expect(response.status).toEqual(200);
    expect(response.body).toHaveLength(1);
  });

  it('does not let non cluster member get an api key', async () => {
    // given
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const { project } = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/projects/${project.id}/api_keys`)
      .set('Authorization', `Bearer ${token}`);

    // then
    expect(response.status).toEqual(403);
  });
});
