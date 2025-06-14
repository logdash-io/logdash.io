import { RedisClientType } from '@redis/client';
import { RedisContainer } from '@testcontainers/redis';

export const createRedisTestContainer = async (): Promise<void> => {
  const redisContainer = await new RedisContainer('redis:latest').start();

  console.log('Started redis');
  console.log(redisContainer.getConnectionUrl());

  global.redisContainer = redisContainer;
};

export const getRedisTestContainerUrl = (): string => {
  return global.redisContainer.getConnectionUrl();
};

export const closeRedisTestContainer = async () => {
  await global.redisContainer.stop();
};

export async function removeKeysWhichWouldExpireInNextXSeconds(
  client: RedisClientType,
  seconds: number,
): Promise<void> {
  const keys = await client.keys('*');
  const keysToRemove = keys.filter(async (key) => {
    const ttl = await client.ttl(key);
    return ttl <= seconds;
  });
  await client.del(keysToRemove);
}
