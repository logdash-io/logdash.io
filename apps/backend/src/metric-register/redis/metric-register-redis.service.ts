import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { MetricRegisterReadService } from '../read/metric-register-read.service';

export enum AddToSetResult {
  Added = 'added',
  AlreadyInSet = 'alreadyInSet',
  OverLimit = 'overLimit',
  SetEmptyProjectLocked = 'setEmptyProjectLocked',
}

const TRY_ADD_TO_SET_WITH_LIMIT_SCRIPT = `
-- KEYS[1] - set key (created-metrics:project:<projectId>)
-- KEYS[2] - lock key (created-metrics:project-lock:<projectId>)
-- ARGV[1] - value to add
-- ARGV[2] - limit
-- ARGV[3] - acceptIfSetIsEmpty (0 or 1)

local setKey = KEYS[1]
local lockKey = KEYS[2]
local value = ARGV[1]
local limit = tonumber(ARGV[2])
local acceptIfSetIsEmpty = ARGV[3] == '1'

-- Check if set exists and has members
local currentSize = redis.call('SCARD', setKey)
if currentSize == 0 then
    if not acceptIfSetIsEmpty then
        -- Set project lock
        redis.call('SET', lockKey, '1')
        return 'setEmptyProjectLocked'
    else
        -- Add to empty set and return success
        redis.call('SADD', setKey, value)
        return 'added'
    end
end

-- Check if value already exists in set
if redis.call('SISMEMBER', setKey, value) == 1 then
    return 'alreadyInSet'
end

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

  constructor(
    private readonly redisService: RedisService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
  ) {}

  private async getScriptSha(): Promise<string> {
    if (!this.scriptSha) {
      this.scriptSha = await this.redisService.scriptLoad(TRY_ADD_TO_SET_WITH_LIMIT_SCRIPT);
    }
    return this.scriptSha;
  }

  public async tryAddToCreatedSet(
    projectId: string,
    metricName: string,
    limit: number,
    acceptIfSetIsEmpty: boolean = false,
  ): Promise<AddToSetResult> {
    const setKey = this.getCreatedMetricsKey(projectId);
    const lockKey = this.getProjectLockKey(projectId);
    const sha = await this.getScriptSha();

    const result = await this.redisService.evalSha(
      sha,
      2,
      [setKey, lockKey],
      [metricName, limit.toString(), acceptIfSetIsEmpty ? '1' : '0'],
    );

    return result as AddToSetResult;
  }

  public async getSet(projectId: string): Promise<string[]> {
    const key = this.getCreatedMetricsKey(projectId);
    return this.redisService.sMembers(key);
  }

  public async projectIsLocked(projectId: string): Promise<boolean> {
    const lockKey = this.getProjectLockKey(projectId);
    const lock = await this.redisService.get(lockKey);
    return lock === '1';
  }

  public async unlockProject(projectId: string): Promise<void> {
    const lockKey = this.getProjectLockKey(projectId);
    await this.redisService.del(lockKey);
  }

  public async syncProjectFromMongo(projectId: string): Promise<void> {
    const setKey = this.getCreatedMetricsKey(projectId);

    const metrics = await this.metricRegisterReadService.readBelongingToProject(projectId);

    await this.redisService.del(setKey);

    if (metrics.length === 0) {
      return;
    }

    await this.redisService.sAdd(
      setKey,
      metrics.map((metric) => metric.name),
    );
  }

  private getCreatedMetricsKey(projectId: string): string {
    return `created-metrics:project:${projectId}`;
  }

  private getProjectLockKey(projectId: string): string {
    return `created-metrics:project-lock:${projectId}`;
  }
}
