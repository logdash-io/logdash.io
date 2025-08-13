import * as request from 'supertest';
import { Types } from 'mongoose';
import { createTestApp } from '../utils/bootstrap';
import { AccountClaimStatus } from '../../src/user/core/enum/account-claim-status.enum';
import * as nock from 'nock';
import { AuthMethod } from '../../src/user/core/enum/auth-method.enum';
import { AuditLogUserAction } from '../../src/audit-log/core/enums/audit-log-actions.enum';

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

    nock('https://www.googleapis.com')
      .get('/oauth2/v3/userinfo')
      .reply(200, { email: 'primary@test.com', picture: 'https://some-avatar.com' });

    await request(bootstrap.app.getHttpServer()).post('/auth/google/claim').send({
      code: 'whatever',
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

    nock('https://www.googleapis.com')
      .get('/oauth2/v3/userinfo')
      .reply(200, { email: 'test@test.com', picture: 'https://some-avatar.com' });

    const existingUser = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'test@test.com',
    });

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/google/login')
      .send({
        code: 'whatever',
      });

    // then
    expect(loginResponse.body.token).toBeDefined();
    await bootstrap.utils.auditLogUtils.assertAuditLog({
      userId: existingUser.user.id,
      action: AuditLogUserAction.GoogleLogin,
    });
  });

  it('creates new user if not exists (and accepted terms)', async () => {
    // given
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: 'some-token' });

    nock('https://www.googleapis.com')
      .get('/oauth2/v3/userinfo')
      .reply(200, { email: 'primary@test.com', picture: 'https://some-avatar.com' });

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/google/login')
      .send({
        code: 'whatever',
        termsAccepted: true,
        emailAccepted: true,
      });

    // then
    expect(loginResponse.body.token).toBeDefined();
    expect(await bootstrap.models.userModel.findOne()).toMatchObject({
      email: 'primary@test.com',
      accountClaimStatus: AccountClaimStatus.Claimed,
      authMethod: AuthMethod.Google,
      avatarUrl: 'https://some-avatar.com',
      marketingConsent: true,
    });
  });

  it('throws error when user does not exists and did not accept terms', async () => {
    // given
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: 'some-token' });

    nock('https://www.googleapis.com')
      .get('/oauth2/v3/userinfo')
      .reply(200, { email: 'primary@test.com', picture: 'https://some-avatar.com' });

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/google/login')
      .send({
        code: 'whatever',
        termsAccepted: false,
      });

    // then
    expect(loginResponse.status).toEqual(400);
    expect(loginResponse.body.message).toEqual('Cannot create new account without accepting terms');
  });
});
