import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { mongo } from 'mongoose';
import { ApiKeyReadCachedService } from '../../api-key/read/api-key-read-cached.service';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { RedisService } from '../../shared/redis/redis.service';
import { UserReadCachedService } from '../../user/read/user-read-cached.service';
import { ProjectNormalized } from '../core/entities/project.interface';
import { projectTierFromUserTier } from '../core/enums/project-tier.enum';
import { ProjectLimitService } from '../limit/project-limit-service';
import { ProjectReadCachedService } from '../read/project-read-cached.service';
import { ProjectReadService } from '../read/project-read.service';
import { ProjectWriteService } from '../write/project-write.service';

export const DEFAULT_APP_NAME = 'default';

const DUPLICATE_KEY_ERROR_CODE = 11000;

@Injectable()
export class IngestProjectService {
  constructor(
    private readonly apiKeyReadCachedService: ApiKeyReadCachedService,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly projectReadService: ProjectReadService,
    private readonly projectWriteService: ProjectWriteService,
    private readonly projectLimitService: ProjectLimitService,
    private readonly clusterReadCachedService: ClusterReadCachedService,
    private readonly userReadCachedService: UserReadCachedService,
    private readonly redisService: RedisService,
  ) {}

  public async resolve(apiKeyValue: string | undefined, app?: string): Promise<ProjectNormalized> {
    const target = await this.apiKeyReadCachedService.readTarget(apiKeyValue);

    if (!target) {
      throw new UnauthorizedException('Invalid API key');
    }

    if ('projectId' in target) {
      return this.projectReadCachedService.readProjectOrThrow(target.projectId);
    }

    return this.resolveApp(target.clusterId, app || DEFAULT_APP_NAME);
  }

  public async resolveAppName(
    apiKeyValue: string | undefined,
    app?: string,
  ): Promise<{ clusterId: string; app: string }> {
    const target = await this.apiKeyReadCachedService.readTarget(apiKeyValue);

    if (!target) {
      throw new UnauthorizedException('Invalid API key');
    }

    if ('clusterId' in target) {
      return { clusterId: target.clusterId, app: app || DEFAULT_APP_NAME };
    }

    const project = await this.projectReadCachedService.readProjectOrThrow(target.projectId);

    return { clusterId: project.clusterId, app: project.name };
  }

  private async resolveApp(clusterId: string, name: string): Promise<ProjectNormalized> {
    const cacheKey = `cluster:${clusterId}:app:${name}`;
    const cachedProjectId = await this.redisService.get(cacheKey);
    const cached = cachedProjectId
      ? await this.projectReadCachedService.readProject(cachedProjectId)
      : null;

    if (cached) {
      return cached;
    }

    const project =
      (await this.projectReadService.readOldestByClusterIdAndName(clusterId, name)) ??
      (await this.createApp(clusterId, name));

    await this.redisService.set(cacheKey, project.id, 60);

    return project;
  }

  private async createApp(clusterId: string, name: string): Promise<ProjectNormalized> {
    const cluster = await this.clusterReadCachedService.readById(clusterId);

    if (!cluster) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!(await this.projectLimitService.newProjectWouldBeWithinLimit(cluster.creatorId))) {
      throw new ConflictException('You have reached the maximum number of apps for your plan');
    }

    const userTier = await this.userReadCachedService.readTier(cluster.creatorId);

    try {
      return await this.projectWriteService.create({
        name,
        userId: cluster.creatorId,
        clusterId,
        tier: projectTierFromUserTier(userTier),
        autoCreated: true,
      });
    } catch (error) {
      const winner = this.isDuplicateKeyError(error)
        ? await this.projectReadService.readOldestByClusterIdAndName(clusterId, name)
        : null;

      if (!winner) {
        throw error;
      }

      return winner;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return error instanceof mongo.MongoServerError && error.code === DUPLICATE_KEY_ERROR_CODE;
  }
}
