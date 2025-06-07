import { Global, Module } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { getEnvConfig } from '../shared/configs/env-configs';

@Global()
@Module({
  providers: [
    {
      provide: ClickHouseClient,
      useFactory: async (): Promise<ClickHouseClient> => {
        const clickHouseConfig = getEnvConfig().clickhouse;

        const client = createClient({ ...clickHouseConfig });

        const pingResult = await client.ping();

        if (!pingResult.success) {
          throw new Error('Failed to initialize ClickHouse - ping result is not successful');
        }

        return client;
      },
    },
  ],
  exports: [ClickHouseClient],
})
export class ClickhouseModule {}
