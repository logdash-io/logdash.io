import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';
import { UserSerialized } from '../../src/user/core/entities/user.interface';

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
    expect((response.body as UserSerialized).email).toEqual('test@test.com');
  });

  it('exposes when terms were accepted and onboarding was completed', async () => {
    // given
    const { token, user } = await bootstrap.utils.generalUtils.setupClaimed();

    const readMe = async (): Promise<UserSerialized> =>
      (
        await request(bootstrap.app.getHttpServer())
          .get('/users/me')
          .set('authorization', `Bearer ${token}`)
      ).body as UserSerialized;

    const before = await readMe();

    await bootstrap.models.userModel.updateOne(
      { _id: new Types.ObjectId(user.id) },
      {
        termsAcceptedAt: new Date('2026-01-01T10:00:00.000Z'),
        onboarding: {
          role: 'developer',
          source: 'search',
          completedAt: new Date('2026-01-01T10:05:00.000Z'),
        },
      },
    );

    // when
    const after = await readMe();

    // then
    expect(before).toMatchObject({ termsAcceptedAt: null, onboardingCompletedAt: null });
    expect(after).toMatchObject({
      termsAcceptedAt: '2026-01-01T10:00:00.000Z',
      onboardingCompletedAt: '2026-01-01T10:05:00.000Z',
    });
    expect(after).not.toHaveProperty('onboarding');
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
