import { createClickHouseTestContainer } from './clickhouse-test-container-server';
import { createRedisTestContainer } from './redis-test-container-server';

process.on('uncaughtException', (error) => {
  console.error(error);
});

process.on('unhandledRejection', (error) => {
  console.error(error);
});

process.on('uncaughtExceptionMonitor', (error) => {
  console.error(error);
});

export default async () => {
  console.log('Starting global test setup...');

  try {
    await Promise.all([createClickHouseTestContainer(), createRedisTestContainer()]);
  } catch (error) {
    console.error('Failed to start test containers:', error);
    throw error;
  }

  console.log('Global test setup completed');
};
