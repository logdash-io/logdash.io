import { DynamicModule, Global, Module, Provider, OnApplicationShutdown } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from '@redis/client';
import { REDIS_CLIENT, REDIS_OPTIONS } from './redis.constants';
import { ModuleRef } from '@nestjs/core';

export interface RedisModuleOptions {
  url: string;
}

@Global()
@Module({})
export class RedisModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown(): Promise<void> {
    try {
      const client = this.moduleRef.get<any>(REDIS_CLIENT);
      if (client && client.isOpen) {
        await client.quit();
      }
    } catch (error) {}
  }

  public static forRoot(options: RedisModuleOptions): DynamicModule {
    const redisOptionsProvider: Provider = {
      provide: REDIS_OPTIONS,
      useValue: options,
    };

    const redisClientProvider: Provider = {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        const url = options.url;

        const client = createClient({
          url,
          database: 0,
        });

        client.on('error', (err) => {
          console.error('Redis client error', err);
        });

        await client.connect();
        return client;
      },
    };

    return {
      module: RedisModule,
      providers: [redisOptionsProvider, redisClientProvider, RedisService],
      exports: [redisClientProvider, RedisService],
    };
  }
}
