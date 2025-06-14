import { closeClickHouseTestContainer } from './clickhouse-test-container-server';
import { closeInMemoryMongoServer } from './mongo-in-memory-server';
import { closeRedisTestContainer } from './redis-test-container-server';

export default async () => {
  try {
    await Promise.all([
      closeClickHouseTestContainer(),
      closeInMemoryMongoServer(),
      closeRedisTestContainer(),
    ]);
  } catch (error) {
    console.log('error on global teardown', error);
  }
};
