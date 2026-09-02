import { advanceBy } from 'jest-date-mock';
import { Types } from 'mongoose';
import * as nock from 'nock';
import * as request from 'supertest';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { getUserPlanConfig } from '../../src/shared/configs/user-plan-configs';
import { AccountClaimStatus } from '../../src/user/core/enum/account-claim-status.enum';
import { AuthMethod } from '../../src/user/core/enum/auth-method.enum';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { createTestApp } from '../utils/bootstrap';

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

  const mockGithubUser = (email: string): void => {
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
          email,
          primary: true,
          verified: true,
        },
      ]);

    nock('https://api.github.com')
      .get('/user')
      .reply(200, { avatar_url: 'https://some-avatar.com' });
  };

  it('lets user get api key without account and then claim it', async () => {
    // when
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

    // then
    mockGithubUser('primary@test.com');

    // and when
    await request(bootstrap.app.getHttpServer()).post('/auth/github/claim').send({
      githubCode: 'whatever',
      accessToken: token,
      termsAccepted: true,
      emailAccepted: true,
    });

    // then
    const user = (await bootstrap.models.userModel.findOne())!;

    expect(user.accountClaimStatus).toEqual(AccountClaimStatus.Claimed);
    expect(user.authMethod).toEqual(AuthMethod.Github);
    expect(user.email).toEqual('primary@test.com');
    expect(user.avatarUrl).toEqual('https://some-avatar.com');
    expect(user.marketingConsent).toEqual(true);
  });

  it('does not claim account into a new account when terms were not accepted', async () => {
    // given
    const { user, token } = await bootstrap.utils.generalUtils.setupAnonymous();

    mockGithubUser('primary@test.com');

    // when
    const response = await request(bootstrap.app.getHttpServer()).post('/auth/github/claim').send({
      githubCode: 'whatever',
      accessToken: token,
    });

    // then
    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual('Cannot create new account without accepting terms');

    const userAfterClaim = (await bootstrap.models.userModel.findById(
      new Types.ObjectId(user.id),
    ))!;

    expect(userAfterClaim.accountClaimStatus).toEqual(AccountClaimStatus.Anonymous);
    expect(userAfterClaim.email).toBeUndefined();
  });

  it('does not remove account if user claims while being logged in', async () => {
    // given
    const { user, token } = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'a@a.pl',
    });

    // when
    mockGithubUser('a@a.pl');

    const response = await request(bootstrap.app.getHttpServer()).post('/auth/github/claim').send({
      githubCode: 'whatever',
      accessToken: token,
    });

    // then
    const userAfterClaim = (await bootstrap.models.userModel.findOne())!;

    expect(userAfterClaim.email).toEqual(user.email);
  });

  it('keeps temporary user when account it is merged into reached the project limit', async () => {
    // given
    const anonymous = await bootstrap.utils.generalUtils.setupAnonymous();
    const alreadyRegistered = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'primary@test.com',
    });

    const maxNumberOfProjects = getUserPlanConfig(UserTier.Free).projects.maxNumberOfProjects;

    for (let i = 1; i < maxNumberOfProjects; i++) {
      await bootstrap.utils.projectUtils.createDefaultProject({
        userId: alreadyRegistered.user.id,
        clusterId: alreadyRegistered.cluster.id,
      });
    }

    mockGithubUser('primary@test.com');

    // when
    const response = await request(bootstrap.app.getHttpServer()).post('/auth/github/claim').send({
      githubCode: 'whatever',
      accessToken: anonymous.token,
    });

    // then
    expect(response.status).toEqual(409);
    expect(response.body.message).toEqual('User has reached the project limit');

    const temporaryUserAfterClaim = await bootstrap.models.userModel.findById(
      new Types.ObjectId(anonymous.user.id),
    );

    expect(temporaryUserAfterClaim).not.toBeNull();
  });

  it('rejects anonymous token after anonymous account lifetime has passed', async () => {
    // given
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

    const responseBeforeExpiry = await request(bootstrap.app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);

    // when
    advanceBy((getEnvConfig().anonymousAccounts.removeAfterHours + 1) * 60 * 60 * 1000);

    const responseAfterExpiry = await request(bootstrap.app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);

    // then
    expect(responseBeforeExpiry.status).toEqual(200);
    expect(responseAfterExpiry.status).toEqual(401);
  });
});
