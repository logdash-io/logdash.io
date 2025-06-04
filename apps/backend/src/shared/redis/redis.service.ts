import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from '@redis/client';
import { REDIS_CLIENT } from './redis.constants';

export enum TtlOverwriteStrategy {
  SetAlways = 'set-always',
  SetOnlyIfNoExpiry = 'set-only-if-no-expiry',
}

export interface ExpiryOptions {
  ttlSeconds: number;
  ttlOverwriteStrategy: TtlOverwriteStrategy;
}

@Injectable()
export class RedisService {
  public constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClientType) {}

  public async increment(key: string, expiryOptions?: ExpiryOptions): Promise<number> {
    const result = await this.client.incr(key);
    if (expiryOptions) {
      await this.expire(key, expiryOptions);
    }
    return Number(result);
  }

  public async incrementBy(
    key: string,
    amount: number,
    expiryOptions?: ExpiryOptions,
  ): Promise<number> {
    const result = await this.client.incrBy(key, amount);
    if (expiryOptions) {
      await this.expire(key, expiryOptions);
    }
    return Number(result);
  }

  public async expire(key: string, expiryOptions: ExpiryOptions): Promise<void> {
    const expiryOptionsMap: Record<TtlOverwriteStrategy, 'NX' | undefined> = {
      [TtlOverwriteStrategy.SetAlways]: undefined,
      [TtlOverwriteStrategy.SetOnlyIfNoExpiry]: 'NX',
    };

    const option = expiryOptionsMap[expiryOptions.ttlOverwriteStrategy];

    await this.client.expire(key, expiryOptions.ttlSeconds, option);
  }

  public async get(key: string): Promise<string | null> {
    const result = await this.client.get(key);

    return result;
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public async flushAll(): Promise<void> {
    await this.client.flushAll();
  }
}
