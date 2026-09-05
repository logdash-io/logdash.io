import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { createTestApp } from '../utils/bootstrap';

describe('UserCoreController (writes)', () => {
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

  it('creates anonymous user with cluster', async () => {
    // when
    const response = await request(bootstrap.app.getHttpServer()).post('/users/anonymous');

    // then
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toBeDefined();
    expect(response.body.cluster.creatorId).toBe(response.body.user.id);
  });

  it('creates anonymous user with token expiring together with the account', async () => {
    // when
    const response = await request(bootstrap.app.getHttpServer()).post('/users/anonymous');

    // then
    const payload = bootstrap.app
      .get(JwtService)
      .decode<{ iat: number; exp: number }>(response.body.token);

    expect(payload.exp - payload.iat).toEqual(
      getEnvConfig().anonymousAccounts.removeAfterHours * 3600,
    );
  });
});
