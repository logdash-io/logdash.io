import * as request from 'supertest';
import { Types } from 'mongoose';
import { createTestApp } from '../utils/bootstrap';
import { AccountClaimStatus } from '../../src/user/core/enum/account-claim-status.enum';
import * as nock from 'nock';
import { AuthMethod } from '../../src/user/core/enum/auth-method.enum';
import { AuditLogUserAction } from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { sleep } from '../utils/sleep';

describe('Auth (anonymous)', () => {
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
    nock('https://github.com')
      .post('/login/oauth/access_token')
      .query(true)
      .reply(200, 'access_token=some-token&');

    nock('https://api.github.com')
      .get('/user/emails')
      .reply(200, [
        {
          email: 'secondary@test.com',
          primary: false,
        },
        {
          email: 'primary@test.com',
          primary: true,
        },
      ]);
    nock('https://api.github.com')
      .get('/user')
      .reply(200, { avatar_url: 'https://some-avatar.com' });

    await request(bootstrap.app.getHttpServer()).post('/auth/github/claim').send({
      githubCode: 'whatever',
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
  });

  it('logs existing user in', async () => {
    // given
    nock('https://github.com')
      .post('/login/oauth/access_token')
      .query(true)
      .reply(200, 'access_token=some-token&');

    nock('https://api.github.com')
      .get('/user/emails')
      .reply(200, [
        {
          email: 'secondary@test.com',
          primary: false,
        },
        {
          email: 'test@test.com',
          primary: true,
        },
      ]);

    nock('https://api.github.com')
      .get('/user')
      .reply(200, { avatar_url: 'https://some-avatar.com' });

    const existingUser = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'test@test.com',
    });

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/github/login')
      .send({
        githubCode: 'whatever',
      });

    // then
    expect(loginResponse.body.token).toBeDefined();
    await bootstrap.utils.auditLogUtils.assertAuditLog({
      userId: existingUser.user.id,
      action: AuditLogUserAction.GithubLogin,
    });
  });

  it('creates new user if not exists (and accepted terms)', async () => {
    // given
    nock('https://github.com')
      .post('/login/oauth/access_token')
      .query(true)
      .reply(200, 'access_token=some-token&');

    nock('https://api.github.com')
      .get('/user/emails')
      .reply(200, [
        {
          email: 'secondary@test.com',
          primary: false,
        },
        {
          email: 'primary@test.com',
          primary: true,
        },
      ]);

    nock('https://api.github.com')
      .get('/user')
      .reply(200, { avatar_url: 'https://some-avatar.com' });

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/github/login')
      .send({
        githubCode: 'whatever',
        termsAccepted: true,
        emailAccepted: true,
      });

    // then
    expect(loginResponse.body.token).toBeDefined();
    expect(await bootstrap.models.userModel.findOne()).toMatchObject({
      email: 'primary@test.com',
      accountClaimStatus: AccountClaimStatus.Claimed,
      authMethod: AuthMethod.Github,
      avatarUrl: 'https://some-avatar.com',
      marketingConsent: true,
    });
  });

  it('throws error when user does not exists and did not accept terms', async () => {
    // given
    nock('https://github.com')
      .post('/login/oauth/access_token')
      .query(true)
      .reply(200, 'access_token=some-token&');

    nock('https://api.github.com')
      .get('/user/emails')
      .reply(200, [
        {
          email: 'secondary@test.com',
          primary: false,
        },
        {
          email: 'primary@test.com',
          primary: true,
        },
      ]);
    nock('https://api.github.com')
      .get('/user')
      .reply(200, { avatar_url: 'https://some-avatar.com' });

    // when
    const loginResponse = await request(bootstrap.app.getHttpServer())
      .post('/auth/github/login')
      .send({
        githubCode: 'whatever',
        termsAccepted: false,
      });

    // then
    expect(loginResponse.status).toEqual(400);
    expect(loginResponse.body.message).toEqual('Cannot create new account without accepting terms');
  });
});
