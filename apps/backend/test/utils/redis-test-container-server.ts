import { RedisClientType } from '@redis/client';
import { RedisContainer } from '@testcontainers/redis';

export const createRedisTestContainer = async (): Promise<void> => {
  const redisContainer = await new RedisContainer('redis:latest').withReuse().start();

  process.env.TEST_REDIS_URL = redisContainer.getConnectionUrl();
};

export const getRedisTestContainerUrl = (): string => {
  return process.env.TEST_REDIS_URL!;
};

export async function removeKeysWhichWouldExpireInNextXSeconds(
  client: RedisClientType,
  seconds: number,
): Promise<void> {
  const keys = await client.keys('*');
  const ttls = await Promise.all(keys.map((key) => client.ttl(key)));
  const keysToRemove = keys.filter((_, index) => ttls[index] >= 0 && ttls[index] <= seconds);

  if (keysToRemove.length > 0) {
    await client.del(keysToRemove);
  }
}
