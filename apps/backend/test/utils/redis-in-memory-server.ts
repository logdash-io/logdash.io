import { RedisClientType } from '@redis/client';
import { RedisMemoryServer } from 'redis-memory-server';

export const redisInMemoryServer = new RedisMemoryServer({ autoStart: false });

export const getInMemoryRedisUri = async (): Promise<string> => {
  try {
    await redisInMemoryServer.start();
  } catch {}

  const protocol = 'redis';
  const host = await redisInMemoryServer.getHost();
  const port = await redisInMemoryServer.getPort();

  const uri = `${protocol}://${host}:${port}`;

  return uri;
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
