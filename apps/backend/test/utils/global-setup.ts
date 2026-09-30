import { createClickHouseTestContainer } from './clickhouse-test-container-server';
import { createRedisTestContainer } from './redis-test-container-server';

export default async () => {
  // Set here, not in setup-env.ts: test files get a copy of process.env, so only the parent
  // process can change the time zone the test workers start with. Production runs in UTC.
  process.env.TZ = 'UTC';

  console.log('\nStarting global test setup...');

  try {
    await Promise.all([createClickHouseTestContainer(), createRedisTestContainer()]);
  } catch (error) {
    console.error('Failed to start test containers:', error);
    throw error;
  }

  console.log('Global test setup completed');
};
