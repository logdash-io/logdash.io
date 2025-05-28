import { createClient } from '@clickhouse/client';
import { Global, Module } from '@nestjs/common';
import { getEnvConfig } from '../configs/env-configs';

export const CLICKHOUSE_CLIENT = Symbol('CLICKHOUSE_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: CLICKHOUSE_CLIENT,
      useValue: createClient({ ...getEnvConfig().clickhouse }),
    },
  ],
  exports: [CLICKHOUSE_CLIENT],
})
export class ClickhouseModule {}
