import { RedisClientType } from '@redis/client';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

declare global {
  var redisContainer: StartedRedisContainer;
}

export const createRedisTestContainer = async (): Promise<void> => {
  const redisContainer = await new RedisContainer('redis:latest').withReuse().start();

  global.redisContainer = redisContainer;
};

export const getRedisTestContainerUrl = (): string => {
  return global.redisContainer.getConnectionUrl();
};

export const closeRedisTestContainer = async (): Promise<void> => {
  await global.redisContainer.stop();
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
