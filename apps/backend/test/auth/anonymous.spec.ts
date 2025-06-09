import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { AccountClaimStatus } from '../../src/user/core/enum/account-claim-status.enum';
import { AuthMethod } from '../../src/user/core/enum/auth-method.enum';
import * as nock from 'nock';

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
  it('lets user get api key without account and then claim it', async () => {
    // when
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

    // then
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

    // and when
    await request(bootstrap.app.getHttpServer()).post('/auth/github/claim').send({
      githubCode: 'whatever',
      accessToken: token,
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

  it('does not remove account if user claims while being logged in', async () => {
    // given
    const { user, token } = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'a@a.pl',
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
          email: 'a@a.pl',
          primary: true,
        },
      ]);
    nock('https://api.github.com')
      .get('/user')
      .reply(200, { avatar_url: 'https://some-avatar.com' });

    const response = await request(bootstrap.app.getHttpServer()).post('/auth/github/claim').send({
      githubCode: 'whatever',
      accessToken: token,
    });

    // then
    const userAfterClaim = (await bootstrap.models.userModel.findOne())!;

    expect(userAfterClaim.email).toEqual(user.email);
  });
});
