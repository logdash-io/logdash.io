import { createClickHouseTestContainer } from './clickhouse-test-container-server';

export default async () => {
  console.log('Starting global test setup...');

  try {
    await createClickHouseTestContainer();
  } catch (error) {
    console.error('Failed to start ClickHouse container:', error);
    throw error;
  }

  console.log('Global test setup completed');
};
