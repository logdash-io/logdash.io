import { Global, Module } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { ClickHouseContainer } from '@testcontainers/clickhouse';
import * as path from 'path';

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
    .start();

  global.clickhouseContainer = clickhouseContainer;
};

export const rootClickHouseTestModule = () => {
  @Global()
  @Module({
    providers: [
      {
        provide: ClickHouseClient,
        useFactory: async (): Promise<ClickHouseClient> => {
          const options = global.clickhouseContainer.getClientOptions();

          const client = createClient({
            host: options.url,
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

export const closeClickHouseTestContainer = async () => {
  global.clickhouseContainer.stop();
};
