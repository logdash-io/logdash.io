import { closeClickHouseTestContainer } from './clickhouse-test-container-server';
import { closeInMemoryMongoServer } from './mongo-in-memory-server';

export default async () => {
  await closeClickHouseTestContainer();
  await closeInMemoryMongoServer();
};
