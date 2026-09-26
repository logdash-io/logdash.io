import * as request from 'supertest';
import { Types } from 'mongoose';
import { createTestApp } from '../utils/bootstrap';
import { AccountClaimStatus } from '../../src/user/core/enum/account-claim-status.enum';
import * as nock from 'nock';
import { TokenResponse } from '../../src/shared/responses/token.response';
import { AuthMethod } from '../../src/user/core/enum/auth-method.enum';
import { AuditLogUserAction } from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { ErrorResponse } from '../utils/error-response';
import { UserSerialized } from '../../src/user/core/entities/user.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthEvents } from '../../src/auth/events/auth-events.enum';
import { UserRegisteredEvent } from '../../src/auth/events/definitions/user-registered.event';

describe('Auth (google)', () => {
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

  it('reclaims the cluster if user was already registered', async () => {
    // given
    const anonymous = await bootstrap.utils.generalUtils.setupAnonymous();
    const alreadyRegistered = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'primary@test.com',
    });

    // when
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: 'some-token' });

    nock('https://www.googleapis.com').get('/oauth2/v3/userinfo').reply(200, {
      email: 'primary@test.com',
      email_verified: true,
      picture: 'https://some-avatar.com',
    });

    await request(bootstrap.app.getHttpServer()).post('/auth/google/claim').send({
      googleCode: 'whatever',
      accessToken: anonymous.token,
    });

    // then
    const tempUserAfterClaim = await bootstrap.models.userModel.findOne({
      _id: new Types.ObjectId(anonymous.user.id),
    });

    const clusterAfterClaim = await bootstrap.models.clusterModel.findOne({
      _id: new Types.ObjectId(anonymous.cluster.id),
    });

    expect(tempUserAfterClaim).toBeNull();
    expect(clusterAfterClaim?.creatorId.toString()).toEqual(alreadyRegistered.user.id);
    expect(clusterAfterClaim?.roles).toEqual({ [alreadyRegistered.user.id]: 'creator' });
  }, 60_000);

  it('logs existing user in', async () => {
    // given
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: 'some-token' });

    nock('https://www.googleapis.com').get('/oauth2/v3/userinfo').reply(200, {
      email: 'test@test.com',
      email_verified: true,
      picture: 'https://some-avatar.com',
    });

    const existingUser = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'test@test.com',
    });

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/google/login')
      .send({
        googleCode: 'whatever',
      });

    // then
    expect((loginResponse.body as TokenResponse).token).toBeDefined();
    await bootstrap.utils.auditLogUtils.assertAuditLog({
      userId: existingUser.user.id,
      action: AuditLogUserAction.GoogleLogin,
    });
  });

  it('creates new user with consents given up front by an older client', async () => {
    // given
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: 'some-token' });

    nock('https://www.googleapis.com').get('/oauth2/v3/userinfo').reply(200, {
      email: 'primary@test.com',
      email_verified: true,
      picture: 'https://some-avatar.com',
    });

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/google/login')
      .send({
        googleCode: 'whatever',
        termsAccepted: true,
        emailAccepted: true,
      });

    // then
    expect((loginResponse.body as TokenResponse).token).toBeDefined();
    expect(await bootstrap.models.userModel.findOne()).toMatchObject({
      email: 'primary@test.com',
      accountClaimStatus: AccountClaimStatus.Claimed,
      authMethod: AuthMethod.Google,
      avatarUrl: 'https://some-avatar.com',
      marketingConsent: true,
    });

    const me = await request(bootstrap.app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${(loginResponse.body as TokenResponse).token}`);

    const user = me.body as UserSerialized;
    expect(user.termsAcceptedAt).toEqual(expect.any(String));
    expect(user.onboardingCompletedAt).toEqual(user.termsAcceptedAt);
  });

  it('does not log user in when google email is not verified', async () => {
    // given
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: 'some-token' });

    nock('https://www.googleapis.com').get('/oauth2/v3/userinfo').reply(200, {
      email: 'test@test.com',
      email_verified: false,
      picture: 'https://some-avatar.com',
    });

    await bootstrap.utils.generalUtils.setupClaimed({
      email: 'test@test.com',
    });

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/google/login')
      .send({
        googleCode: 'whatever',
      });

    // then
    expect(loginResponse.status).toEqual(401);
    expect((loginResponse.body as ErrorResponse).message).toEqual('Google email is not verified');
  });

  it('does not log user in when account was created with another auth method', async () => {
    // given
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: 'some-token' });

    nock('https://www.googleapis.com').get('/oauth2/v3/userinfo').reply(200, {
      email: 'test@test.com',
      email_verified: true,
      picture: 'https://some-avatar.com',
    });

    const existingUser = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'test@test.com',
    });

    await bootstrap.models.userModel.updateOne(
      { _id: new Types.ObjectId(existingUser.user.id) },
      { authMethod: AuthMethod.Github },
    );

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/google/login')
      .send({
        googleCode: 'whatever',
      });

    // then
    expect(loginResponse.status).toEqual(401);
    expect((loginResponse.body as ErrorResponse).message).toEqual(
      'Account was created with a different sign in method',
    );
  });

  it('creates new user without consents so they are asked after sign in', async () => {
    // given
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: 'some-token' });

    nock('https://www.googleapis.com').get('/oauth2/v3/userinfo').reply(200, {
      email: 'primary@test.com',
      email_verified: true,
      picture: 'https://some-avatar.com',
    });

    const registeredEvents: UserRegisteredEvent[] = [];
    const eventEmitter = bootstrap.app.get(EventEmitter2);
    const listener = (event: UserRegisteredEvent): void => {
      registeredEvents.push(event);
    };
    eventEmitter.on(AuthEvents.UserRegistered, listener);

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/google/login')
      .send({
        googleCode: 'whatever',
      });

    eventEmitter.off(AuthEvents.UserRegistered, listener);

    // then
    expect(loginResponse.status).toEqual(201);

    const me = await request(bootstrap.app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${(loginResponse.body as TokenResponse).token}`);

    expect(me.body).toMatchObject({
      email: 'primary@test.com',
      accountClaimStatus: AccountClaimStatus.Claimed,
      termsAcceptedAt: null,
      onboardingCompletedAt: null,
    });
    expect((await bootstrap.models.userModel.findOne())?.marketingConsent).toEqual(false);
    expect(registeredEvents).toEqual([
      expect.objectContaining({ email: 'primary@test.com', emailAccepted: false }),
    ]);
  });
});
