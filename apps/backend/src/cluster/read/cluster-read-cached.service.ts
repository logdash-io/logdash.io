import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { ClusterTier } from '../core/enums/cluster-tier.enum';
import { ClusterReadService } from './cluster-read.service';
import { ClusterNormalized } from '../core/entities/cluster.interface';
import { ClusterRole } from '../core/enums/cluster-role.enum';

@Injectable()
export class ClusterReadCachedService {
  constructor(
    private readonly clusterReadService: ClusterReadService,
    private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {}

  public async readById(clusterId: string): Promise<ClusterNormalized | null> {
    const cacheKey = `cluster:${clusterId}`;
    const cacheTtlSeconds = 5;

    const clusterJson = await this.redisService.get(cacheKey);

    if (clusterJson === 'null') {
      throw Error('Cluster not found. You have to wait 5 seconds before trying again');
    }

    if (clusterJson !== null) {
      return JSON.parse(clusterJson) as ClusterNormalized;
    }

    const cluster = await this.clusterReadService.readById(clusterId);

    if (!cluster) {
      await this.redisService.set(cacheKey, 'null', cacheTtlSeconds);
      this.logger.error(`Cluster not found`, { clusterId });
      return null;
    }

    await this.redisService.set(cacheKey, JSON.stringify(cluster), cacheTtlSeconds);

    return cluster;
  }

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

  public async readUserRole(dto: {
    clusterId: string;
    userId: string;
  }): Promise<ClusterRole | null> {
    const cacheKey = `cluster:${dto.clusterId}:user:${dto.userId}:role`;
    const cacheTtlSeconds = 5;
    const cachedResult = await this.redisService.get(cacheKey);

    if (cachedResult !== null) {
      return cachedResult as ClusterRole;
    }

    const cluster = await this.clusterReadService.readById(dto.clusterId);

    if (!cluster) {
      await this.redisService.set(cacheKey, 'null', cacheTtlSeconds);
      this.logger.error(`Cluster not found`, { clusterId: dto.clusterId });
      return null;
    }

    const role = cluster.roles?.[dto.userId];

    if (!role) {
      await this.redisService.set(cacheKey, 'null', cacheTtlSeconds);
      return null;
    }

    await this.redisService.set(cacheKey, role, cacheTtlSeconds);

    return role;
  }
}
