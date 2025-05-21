import { Injectable } from '@nestjs/common';
import { ProjectReadService } from './project-read.service';
import { ProjectTier } from '../core/enums/project-tier.enum';
import { RedisService } from '../../shared/redis/redis.service';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class ProjectReadCachedService {
  constructor(
    private readonly projectReadService: ProjectReadService,
    private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {}

  public async readTier(projectId: string): Promise<ProjectTier> {
    const cacheKey = `project:${projectId}:tier`;
    const cacheTtlSeconds = 10;

    const tier = await this.redisService.get(cacheKey);

    if (tier === 'null') {
      throw Error('Project not found. You have to wait 5 seconds before trying again');
    }

    if (tier !== null) {
      return tier as ProjectTier;
    }

    const project = await this.projectReadService.readByProjectId(projectId);

    if (!project) {
      await this.redisService.set(cacheKey, 'null', cacheTtlSeconds);
      this.logger.error(`Project not found`, {
        projectId,
      });
      throw Error('Project not found');
    }

    await this.redisService.set(cacheKey, project.tier, cacheTtlSeconds);

    return project.tier;
  }

  public async readClusterId(projectId: string): Promise<string> {
    const cacheKey = `project:${projectId}:cluster-id`;
    const cacheTtlSeconds = 5;

    const clusterId = await this.redisService.get(cacheKey);

    if (clusterId === 'null') {
      throw Error('Project not found. You have to wait 5 seconds before trying again');
    }

    if (clusterId !== null) {
      return clusterId;
    }

    const project = await this.projectReadService.readByProjectId(projectId);

    if (!project) {
      await this.redisService.set(cacheKey, 'null', cacheTtlSeconds);
      this.logger.error(`Project not found`, {
        projectId,
      });
      throw Error('Project not found');
    }

    await this.redisService.set(cacheKey, project.clusterId, cacheTtlSeconds);

    return project.clusterId;
  }
}
