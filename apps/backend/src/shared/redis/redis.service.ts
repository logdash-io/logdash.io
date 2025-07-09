import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from '@redis/client';
import { REDIS_CLIENT } from './redis.constants';
import { Logger } from '@logdash/js-sdk';

export enum TtlOverwriteStrategy {
  SetAlways = 'set-always',
  SetOnlyIfNoExpiry = 'set-only-if-no-expiry',
}

export interface ExpiryOptions {
  ttlSeconds: number;
  ttlOverwriteStrategy: TtlOverwriteStrategy;
}

interface KeyTimingData {
  times: number[];
  lastAccessed: number;
}

@Injectable()
export class RedisService {
  private readonly keyTimingMap = new Map<string, KeyTimingData>();
  private readonly maxTimingsPerKey = 1000;
  private readonly statsInterval: NodeJS.Timeout;

  public constructor(
    @Inject(REDIS_CLIENT) private readonly client: RedisClientType,
    private readonly logger: Logger,
  ) {
    this.statsInterval = setInterval(() => {
      this.logKeyStatistics();
    }, 5000);
  }

  private calculatePercentiles(values: number[]): { p50: number; p90: number; p99: number } {
    const sorted = values.slice().sort((a, b) => a - b);
    const length = sorted.length;

    const getPercentile = (percentile: number): number => {
      const index = (percentile / 100) * (length - 1);
      const lowerIndex = Math.floor(index);
      const upperIndex = Math.min(lowerIndex + 1, length - 1);
      const weight = index - lowerIndex;

      return sorted[lowerIndex] + weight * (sorted[upperIndex] - sorted[lowerIndex]);
    };

    return {
      p50: getPercentile(50),
      p90: getPercentile(90),
      p99: getPercentile(99),
    };
  }

  private logKeyStatistics(): void {
    if (this.keyTimingMap.size === 0) {
      return;
    }

    const keyStatistics: Array<{
      key: string;
      scannedCount: number;
      p50: number;
      p90: number;
      p99: number;
    }> = [];

    for (const [key, data] of this.keyTimingMap.entries()) {
      if (data.times.length > 0) {
        const percentiles = this.calculatePercentiles(data.times);
        keyStatistics.push({
          key,
          scannedCount: data.times.length,
          p50: percentiles.p50,
          p90: percentiles.p90,
          p99: percentiles.p99,
        });
      }
    }

    if (keyStatistics.length > 0) {
      this.logger.info('Redis key statistics', {
        keys: keyStatistics,
        totalKeys: keyStatistics.length,
      });
    }

    this.keyTimingMap.clear();
  }

  private trackKeyTiming(key: string, duration: number): void {
    let keyData = this.keyTimingMap.get(key);

    if (!keyData) {
      keyData = {
        times: [],
        lastAccessed: Date.now(),
      };
      this.keyTimingMap.set(key, keyData);
    }

    keyData.times.push(duration);
    keyData.lastAccessed = Date.now();

    if (keyData.times.length > this.maxTimingsPerKey) {
      keyData.times = keyData.times.slice(-this.maxTimingsPerKey);
    }
  }

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
    const startTime = Date.now();
    const result = await this.client.get(key);
    const endTime = Date.now();

    this.trackKeyTiming(key, endTime - startTime);

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

  public async delPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);

    if (keys.length > 0) {
      await this.client.del(keys);
    }
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

  public async mGet(keys: string[]): Promise<Record<string, string | null>> {
    const result = await this.client.mGet(keys);
    return result.reduce(
      (acc, value, index) => {
        acc[keys[index]] = value;
        return acc;
      },
      {} as Record<string, string | null>,
    );
  }

  public async scriptLoad(script: string): Promise<string> {
    return await this.client.scriptLoad(script);
  }

  public async evalSha(
    sha: string,
    numKeys: number,
    keys: string[],
    args: string[],
  ): Promise<string> {
    return (await this.client.evalSha(sha, {
      keys,
      arguments: args,
    })) as string;
  }

  public async sMembers(key: string): Promise<string[]> {
    return await this.client.sMembers(key);
  }

  public async sAdd(key: string, value: string | string[]): Promise<void> {
    await this.client.sAdd(key, value);
  }

  public async sRem(key: string, value: string): Promise<void> {
    await this.client.sRem(key, value);
  }

  public async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  public onModuleDestroy(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }
}
