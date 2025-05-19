import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { closeInMemoryMongoServer } from '../utils/mongo-in-memory-server';

describe('UserCoreController (reads)', () => {
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

  it('returns current user if logged in', async () => {
    // given
    const { token } = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'test@test.com',
    });

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get('/users/me')
      .set('authorization', `Bearer ${token}`);

    // then
    expect(response.body.email).toEqual('test@test.com');
  });

  it('returns exception if not logged in', async () => {
    // given
    const token = 'asdf';

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get('/users/me')
      .set('authorization', `Bearer ${token}`);

    // then
    expect(response.status).toEqual(401);
  });
});
