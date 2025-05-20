import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { ClusterTier } from '../core/enums/cluster-tier.enum';
import { ClusterReadService } from './cluster-read.service';

@Injectable()
export class ClusterReadCachedService {
  constructor(
    private readonly clusterReadService: ClusterReadService,
    private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {}

  public async readTier(clusterId: string): Promise<ClusterTier> {
    const cacheKey = `cluster:${clusterId}:tier`;
    const cacheTtlSeconds = 5;

    const tier = await this.redisService.get(cacheKey);

    if (tier === 'null') {
      throw Error('Cluster not found. You have to wait 5 seconds before trying again');
    }

    if (tier !== null) {
      return tier as ClusterTier;
    }

    const cluster = await this.clusterReadService.readById(clusterId);

    if (!cluster) {
      await this.redisService.set(cacheKey, 'null', cacheTtlSeconds);
      this.logger.error(`Cluster not found`, { clusterId });
      throw Error('Cluster not found');
    }

    await this.redisService.set(cacheKey, cluster.tier, cacheTtlSeconds);

    return cluster.tier;
  }

  public async countByCreatorId(creatorId: string): Promise<number> {
    const cacheKey = `user:${creatorId}:created-clusters-count`;
    const cacheTtlSeconds = 5;

    const cachedCount = await this.redisService.get(cacheKey);

    if (cachedCount !== null) {
      return parseInt(cachedCount, 10);
    }

    const count = await this.clusterReadService.countByCreatorId(creatorId);

    await this.redisService.set(cacheKey, count.toString(), cacheTtlSeconds);

    return count;
  }

  public async userIsMember(dto: { clusterId: string; userId: string }): Promise<boolean> {
    const cacheKey = `cluster:${dto.clusterId}:member:${dto.userId}`;
    const cacheTtlSeconds = 5;
    const cachedResult = await this.redisService.get(cacheKey);

    if (cachedResult !== null) {
      return cachedResult === 'true';
    }

    const isMember = await this.clusterReadService.userIsMember(dto);
    await this.redisService.set(cacheKey, isMember.toString(), cacheTtlSeconds);

    return isMember;
  }
}
