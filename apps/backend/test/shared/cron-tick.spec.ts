import { setTimeout as sleep } from 'node:timers/promises';
import { RedisService } from '../../src/shared/redis/redis.service';
import { createTestApp } from '../utils/bootstrap';

describe('RedisService.claimCronTick', () => {
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

  it('lets one caller run a tick and frees it after the ttl', async () => {
    // given
    const redisService = bootstrap.app.get(RedisService);

    // when
    const claims = await Promise.all([
      redisService.claimCronTick('job', 100),
      redisService.claimCronTick('job', 100),
    ]);
    await sleep(150);
    const nextTick = await redisService.claimCronTick('job', 100);

    // then
    expect(claims.sort()).toEqual([false, true]);
    expect(nextTick).toEqual(true);
  });
});
