import { closeClickHouseTestContainer } from './clickhouse-test-container-server';
import { closeInMemoryMongoServer } from './mongo-in-memory-server';
import { closeRedisTestContainer } from './redis-test-container-server';

export default async () => {
  console.log('Global teardown');
};
