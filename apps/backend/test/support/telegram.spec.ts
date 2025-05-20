import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { createTestApp } from '../utils/bootstrap';
import { closeInMemoryMongoServer } from '../utils/mongo-in-memory-server';
import * as request from 'supertest';

describe('Telegram (reads)', () => {
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
  it('returns same link for user', async () => {
    // given
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });

    // when
    const responseA = await request(bootstrap.app.getHttpServer())
      .get('/support/telegram/invite-link')
      .set('Authorization', `Bearer ${token}`);

    const responseB = await request(bootstrap.app.getHttpServer())
      .get('/support/telegram/invite-link')
      .set('Authorization', `Bearer ${token}`);

    // then
    expect(responseA.body.url).toEqual(responseB.body.url);
  });

  it('does not let free user create invite link', async () => {
    // given
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Free,
    });

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get('/support/telegram/invite-link')
      .set('Authorization', `Bearer ${token}`);

    // then
    expect(response.status).toEqual(403);
    expect(response.body.message).toEqual(
      'User with free tier is not allowed to create support invite link',
    );
  });
});
