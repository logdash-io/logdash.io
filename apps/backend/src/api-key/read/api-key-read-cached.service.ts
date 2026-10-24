import * as crypto from 'crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { API_KEYS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { RedisService } from '../../shared/redis/redis.service';
import { ApiKeyReadService } from './api-key-read.service';
import { ApiKeyNormalized, IngestKeyTarget } from '../core/entities/api-key.interface';

const NON_EXISTENT = 'non-existent';

@Injectable()
export class ApiKeyReadCachedService {
  constructor(
    private readonly apiKeyReadService: ApiKeyReadService,
    @Inject(API_KEYS_LOGGER) private readonly logger: LogdashLogger,
    private readonly redisService: RedisService,
  ) {}

  public async readTarget(apiKeyValue: string | undefined): Promise<IngestKeyTarget | null> {
    if (!apiKeyValue) {
      return null;
    }

    const cacheKey = `api-key:${this.hashApiKeyValue(apiKeyValue)}:target`;
    const cacheTtlSeconds = 60;

    const cached = await this.redisService.get(cacheKey);

    if (cached === NON_EXISTENT) {
      throw new UnauthorizedException(
        'API key not found. You have to wait 60 seconds before trying again',
      );
    }

    if (cached !== null) {
      return JSON.parse(cached) as IngestKeyTarget;
    }

    const target = this.targetOf(await this.apiKeyReadService.readApiKeyByValue(apiKeyValue));

    if (!target) {
      await this.redisService.set(cacheKey, NON_EXISTENT, cacheTtlSeconds);
      this.logger.warn(`API key not found`, { apiKeyPrefix: apiKeyValue.slice(0, 8) });
      return null;
    }

    await this.redisService.set(cacheKey, JSON.stringify(target), cacheTtlSeconds);

    return target;
  }

  private targetOf(apiKey: ApiKeyNormalized | null): IngestKeyTarget | null {
    if (apiKey?.clusterId) {
      return { clusterId: apiKey.clusterId };
    }

    if (apiKey?.projectId) {
      return { projectId: apiKey.projectId };
    }

    return null;
  }

  private hashApiKeyValue(apiKeyValue: string): string {
    return crypto.createHash('sha256').update(apiKeyValue).digest('hex');
  }
}
