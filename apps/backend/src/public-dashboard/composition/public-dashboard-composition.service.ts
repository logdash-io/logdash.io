import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PublicDashboardDataResponse } from '../core/dto/public-dashboard-data.response';
import { HttpPingReadService } from '../../http-ping/read/http-ping-read.service';
import { PublicDashboardReadService } from '../read/public-dashboard-read.service';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { BucketsPeriod } from '../../http-ping-bucket/core/types/bucket-period.enum';
import { VirtualBucket } from '../../http-ping-bucket/core/types/virtual-bucket.type';
import { Types } from 'mongoose';
import { CustomDomainReadService } from '../../custom-domain/read/custom-domain-read.service';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { getClusterPlanConfig } from '../../shared/configs/cluster-plan-configs';
import { RedisService } from '../../shared/redis/redis.service';
import { HttpPingBucketAggregationService } from '../../http-ping-bucket/aggregation/http-ping-bucket-aggregation.service';

const PUBLIC_CACHE_TTL_SECONDS = 60; // 1 minute
const PRIVATE_CACHE_TTL_SECONDS = 1; // 1 second

enum ResponseType {
  Public = 'public-data',
  Private = 'private-data',
}

@Injectable()
export class PublicDashboardCompositionService {
  constructor(
    private readonly httpPingReadService: HttpPingReadService,
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly customDomainReadService: CustomDomainReadService,
    private readonly clusterReadService: ClusterReadService,
    private readonly httpPingBucketAggregationService: HttpPingBucketAggregationService,
    private readonly redisService: RedisService,
  ) {}

  public async composePublicResponse(
    publicDashboardId: string,
    period: BucketsPeriod,
  ): Promise<PublicDashboardDataResponse> {
    const cachedResponse = await this.getCachedResponse(
      publicDashboardId,
      period,
      ResponseType.Public,
    );

    if (cachedResponse) {
      if (!cachedResponse.isPublic) {
        throw new ForbiddenException('Dashboard is not yet public');
      }

      return cachedResponse;
    }

    let resolvedPublicDashboardId: string | null = null;

    if (Types.ObjectId.isValid(publicDashboardId)) {
      resolvedPublicDashboardId = publicDashboardId;
    } else {
      const customDomain = await this.customDomainReadService.readByDomain(publicDashboardId);

      if (!customDomain) {
        throw new NotFoundException('Custom domain not found');
      }

      resolvedPublicDashboardId = customDomain.publicDashboardId;
    }

    const response = await this.composeResponseData(resolvedPublicDashboardId, period);

    await this.setCachedResponse(
      publicDashboardId,
      period,
      ResponseType.Public,
      response,
      PUBLIC_CACHE_TTL_SECONDS,
    );

    if (!response.isPublic) {
      throw new ForbiddenException('Dashboard is not yet public');
    }

    return response;
  }

  public async composePrivateResponse(
    publicDashboardId: string,
    period: BucketsPeriod,
  ): Promise<PublicDashboardDataResponse> {
    const cachedResponse = await this.getCachedResponse(
      publicDashboardId,
      period,
      ResponseType.Private,
    );

    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await this.composeResponseData(publicDashboardId, period);

    await this.setCachedResponse(
      publicDashboardId,
      period,
      ResponseType.Private,
      response,
      PRIVATE_CACHE_TTL_SECONDS,
    );

    return response;
  }

  private async composeResponseData(
    publicDashboardId: string,
    period: BucketsPeriod,
  ): Promise<PublicDashboardDataResponse> {
    const dashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!dashboard) {
      throw new NotFoundException('Public dashboard not found');
    }

    const cluster = await this.clusterReadService.readByIdOrThrow(dashboard.clusterId);

    const shouldDisplayBuckets = getClusterPlanConfig(cluster.tier).publicDashboard.hasBuckets;

    const monitors = await this.httpMonitorReadService.readManyByIds(dashboard.httpMonitorsIds);

    const pingsByMonitorId = await this.httpPingReadService.readManyByMonitorIds(
      dashboard.httpMonitorsIds,
    );

    const buckets = await this.getBucketsForMonitors(monitors, period);

    const bucketsByMonitorId = this.groupBucketsByMonitorId(buckets);

    return {
      httpMonitors: monitors.map((monitor) => ({
        name: monitor.name,
        buckets: shouldDisplayBuckets ? bucketsByMonitorId[monitor.id] : undefined,
        pings: pingsByMonitorId[monitor.id].map((ping) => ({
          createdAt: ping.createdAt.toISOString(),
          statusCode: ping.statusCode,
          responseTimeMs: ping.responseTimeMs,
        })),
      })),
      name: dashboard.name,
      isPublic: dashboard.isPublic,
    };
  }

  private async getBucketsForMonitors(
    monitors: any[],
    period: BucketsPeriod,
  ): Promise<{ monitorId: string; buckets: (VirtualBucket | null)[] }[]> {
    return Promise.all(
      monitors.map(async (monitor) => {
        const buckets = await this.httpPingBucketAggregationService.getBucketsForMonitor(
          monitor.id,
          period,
        );

        return {
          monitorId: monitor.id,
          buckets,
        };
      }),
    );
  }

  private groupBucketsByMonitorId(
    buckets: { monitorId: string; buckets: (VirtualBucket | null)[] }[],
  ): Record<string, (VirtualBucket | null)[]> {
    return buckets.reduce(
      (acc, bucket) => {
        acc[bucket.monitorId] = bucket.buckets;
        return acc;
      },
      {} as Record<string, (VirtualBucket | null)[]>,
    );
  }

  private async getCachedResponse(
    publicDashboardId: string,
    period: BucketsPeriod,
    responseType: ResponseType,
  ): Promise<PublicDashboardDataResponse | null> {
    const cachedResponse = await this.redisService.get(
      this.getCacheKey(publicDashboardId, period, responseType),
    );

    if (cachedResponse) {
      return JSON.parse(cachedResponse) as PublicDashboardDataResponse;
    }

    return null;
  }

  private async setCachedResponse(
    publicDashboardId: string,
    period: BucketsPeriod,
    responseType: ResponseType,
    response: PublicDashboardDataResponse,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redisService.set(
      this.getCacheKey(publicDashboardId, period, responseType),
      JSON.stringify(response),
      ttlSeconds,
    );
  }

  public async invalidateCache(publicDashboardId: string): Promise<void> {
    await this.redisService.del(
      this.getCacheKey(publicDashboardId, BucketsPeriod.Day, ResponseType.Public),
    );
    await this.redisService.del(
      this.getCacheKey(publicDashboardId, BucketsPeriod.FourDays, ResponseType.Public),
    );
    await this.redisService.del(
      this.getCacheKey(publicDashboardId, BucketsPeriod.NinetyDays, ResponseType.Public),
    );
  }

  private getCacheKey(
    publicDashboardId: string,
    period: BucketsPeriod,
    responseType: ResponseType,
  ): string {
    return `public-dashboard:${publicDashboardId}:${responseType}:${period}`;
  }
}
