import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectReadService } from './project-read.service';
import { RedisService } from '../../shared/redis/redis.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { PROJECTS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { ProjectNormalized } from '../core/entities/project.interface';

@Injectable()
export class ProjectReadCachedService {
  constructor(
    private readonly projectReadService: ProjectReadService,
    @Inject(PROJECTS_LOGGER) private readonly logger: LogdashLogger,
    private readonly redisService: RedisService,
  ) {}

  public async readProject(projectId: string): Promise<ProjectNormalized | null> {
    const cacheKey = `project:${projectId}`;
    const cacheTtlSeconds = 10;

    const projectJson = await this.redisService.get(cacheKey);

    if (projectJson === 'null') {
      throw Error('Project not found. You have to wait 10 seconds before trying again');
    }

    if (projectJson !== null) {
      return JSON.parse(projectJson) as ProjectNormalized;
    }

    const project = await this.projectReadService.readById(projectId);

    if (!project) {
      await this.redisService.set(cacheKey, 'null', cacheTtlSeconds);
      this.logger.error(`Project not found`, {
        projectId,
      });
      return null;
    }

    await this.redisService.set(cacheKey, JSON.stringify(project), cacheTtlSeconds);

    return project;
  }

  public async readProjectOrThrow(projectId: string): Promise<ProjectNormalized> {
    const project = await this.readProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }
}
