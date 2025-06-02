import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { RedisService } from '../../shared/redis/redis.service';
import { ApiKeyReadService } from './api-key-read.service';

const NON_EXISTENT = 'non-existent';

@Injectable()
export class ApiKeyReadCachedService {
  constructor(
    private readonly apiKeyReadService: ApiKeyReadService,
    private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {}

  public async readProjectId(apiKeyValue: string): Promise<string> {
    const cacheKey = `api-key:${apiKeyValue}:project-id`;
    const cacheTtlSeconds = 60;

    const projectId = await this.redisService.get(cacheKey);

    if (projectId === NON_EXISTENT) {
      throw Error('API key not found. You have to wait 60 seconds before trying again');
    }

    if (projectId !== null && Types.ObjectId.isValid(projectId)) {
      return projectId;
    }

    const apiKey = await this.apiKeyReadService.readApiKeyByValue(apiKeyValue);

    if (!apiKey) {
      await this.redisService.set(cacheKey, NON_EXISTENT, cacheTtlSeconds);
      this.logger.error(`API key not found`, { apiKeyValue });
      throw Error('API key not found');
    }

    await this.redisService.set(cacheKey, apiKey.projectId, cacheTtlSeconds);

    return apiKey.projectId;
  }
}
