import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { MetricOperation } from '@logdash/js-sdk';

export enum AddToSetResult {
  Added = 'added',
  AlreadyInSet = 'alreadyInSet',
  OverLimit = 'overLimit',
}

const TRY_ADD_TO_SET_WITH_LIMIT_SCRIPT = `
-- KEYS[1] - set key (created-metrics:project:<projectId>)
-- ARGV[1] - value to add
-- ARGV[2] - limit

local setKey = KEYS[1]
local value = ARGV[1]
local limit = tonumber(ARGV[2])

-- Check if value already exists in set
if redis.call('SISMEMBER', setKey, value) == 1 then
    return 'alreadyInSet'
end

-- Check current set size
local currentSize = redis.call('SCARD', setKey)

-- Check if adding would exceed limit
if currentSize >= limit then
    return 'overLimit'
end

-- Add to set and return success
redis.call('SADD', setKey, value)
return 'added'
`;

@Injectable()
export class MetricRegisterRedisService {
  private scriptSha: string;

  constructor(private readonly redisService: RedisService) {}

  private async getScriptSha(): Promise<string> {
    if (!this.scriptSha) {
      this.scriptSha = await this.redisService.scriptLoad(TRY_ADD_TO_SET_WITH_LIMIT_SCRIPT);
    }
    return this.scriptSha;
  }

  public async tryAddToCreatedSet(
    projectId: string,
    metricId: string,
    limit: number,
  ): Promise<AddToSetResult> {
    const key = `created-metrics:project:${projectId}`;
    const sha = await this.getScriptSha();

    const result = await this.redisService.evalSha(sha, 1, [key], [metricId, limit.toString()]);

    return result as AddToSetResult;
  }

  public async getSet(projectId: string): Promise<string[]> {
    const key = `created-metrics:project:${projectId}`;
    return this.redisService.sMembers(key);
  }
}
