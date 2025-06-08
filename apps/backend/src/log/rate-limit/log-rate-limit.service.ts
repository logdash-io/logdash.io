import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { RedisService, TtlOverwriteStrategy } from '../../shared/redis/redis.service';

@Injectable()
export class LogRateLimitService {
  constructor(
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly redisService: RedisService,
  ) {}

  public async readLogsCountInLastHour(projectId: string): Promise<number> {
    const key = `project:${projectId}:logs-count-in-last-hour`;

    const usage = await this.redisService.get(key);

    return usage ? parseInt(usage) : 0;
  }

  public async requireWithinLimit(
    projectId: string,
    numberOfLogsToBeAdded: number = 1,
  ): Promise<void> {
    const requestCount = await this.incrementLogsCount(projectId, numberOfLogsToBeAdded);

    const project = await this.projectReadCachedService.readProject(projectId);

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const tier = project.tier;

    if (requestCount >= getProjectPlanConfig(tier).logs.rateLimitPerHour) {
      throw new HttpException('Rate limit exceeded', 429);
    }
  }

  private async incrementLogsCount(projectId: string, by: number): Promise<number> {
    const key = `project:${projectId}:logs-count-in-last-hour`;
    const ttlSeconds = 60 * 60; // 1 hour

    return await this.redisService.incrementBy(key, by, {
      ttlOverwriteStrategy: TtlOverwriteStrategy.SetOnlyIfNoExpiry,
      ttlSeconds,
    });
  }
}
