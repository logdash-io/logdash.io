import { Global, Module } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { ClickHouseContainer, StartedClickHouseContainer } from '@testcontainers/clickhouse';
import * as path from 'path';

type ClickHouseClientOptions = ReturnType<StartedClickHouseContainer['getClientOptions']>;

export const createClickHouseTestContainer = async (): Promise<void> => {
  const migrationsPath = path.resolve(__dirname, '../../clickhouse-migrations');
  const logsPath = path.resolve(__dirname, '../../logs');

  const clickhouseContainer = await new ClickHouseContainer('clickhouse/clickhouse-server:latest')
    .withDatabase('default')
    .withUsername('default')
    .withPassword('password')
    .withBindMounts([
      {
        source: migrationsPath,
        target: '/docker-entrypoint-initdb.d',
        mode: 'ro',
      },
      {
        source: logsPath,
        target: '/var/log/clickhouse-server',
        mode: 'rw',
      },
    ])
    .withReuse()
    .start();

  // Global setup runs in the parent process and specs run in a worker, so the
  // connection details travel through the environment the worker inherits.
  process.env.TEST_CLICKHOUSE_OPTIONS = JSON.stringify(clickhouseContainer.getClientOptions());
};

export const rootClickHouseTestModule = () => {
  @Global()
  @Module({
    providers: [
      {
        provide: ClickHouseClient,
        useFactory: async (): Promise<ClickHouseClient> => {
          const options = JSON.parse(
            process.env.TEST_CLICKHOUSE_OPTIONS!,
          ) as ClickHouseClientOptions;

          const client = createClient({
            url: options.url,
            username: options.username,
            password: options.password,
            database: options.database,
          });

          const ping = await client.ping();

          if (!ping.success) {
            throw new Error('ClickHouse test container did not start successfully');
          }

          return client;
        },
      },
    ],
    exports: [ClickHouseClient],
  })
  class ClickHouseTestModule {}

  return ClickHouseTestModule;
};
