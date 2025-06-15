import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicDashboardDataResponse } from '../core/dto/public-dashboard-data.response';
import { HttpPingReadService } from '../../http-ping/read/http-ping-read.service';
import { PublicDashboardReadService } from '../read/public-dashboard-read.service';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpPingSerializer } from '../../http-ping/core/entities/http-ping.serializer';
import { HttpPingBucketAggregationService } from '../../http-ping-bucket/aggregation/http-ping-bucket-aggregation.service';
import { BucketsPeriod } from '../../http-ping-bucket/core/types/bucket-period.enum';
import { VirtualBucket } from '../../http-ping-bucket/core/types/virtual-bucket.type';
import { HttpPingBucketSerializer } from '../../http-ping-bucket/core/entities/http-ping-bucket.serializer';
import { HttpPingBucketNormalized } from '../../http-ping-bucket/core/entities/http-ping-bucket.interface';
import { RedisService } from '../../shared/redis/redis.service';

const CACHE_TTL_SECONDS = 60; // 1 minute

@Injectable()
export class PublicDashboardCompositionService {
  constructor(
    private readonly httpPingReadService: HttpPingReadService,
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpPingBucketAggregationService: HttpPingBucketAggregationService,
    private readonly redisService: RedisService,
  ) {}

  public async composeResponse(
    publicDashboardId: string,
    period: BucketsPeriod,
  ): Promise<PublicDashboardDataResponse> {
    const cachedResponse = await this.getCachedResponse(publicDashboardId, period);

    if (cachedResponse) {
      return cachedResponse;
    }

    const dashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!dashboard) {
      throw new NotFoundException('Public dashboard not found');
    }

    const monitors = await this.httpMonitorReadService.readManyByIds(dashboard.httpMonitorsIds);

    const pingsByMonitorId = await this.httpPingReadService.readManyByMonitorIds(
      dashboard.httpMonitorsIds,
    );

    const buckets = await Promise.all(
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

    const bucketsByMonitorId = buckets.reduce(
      (acc, bucket) => {
        acc[bucket.monitorId] = bucket.buckets;
        return acc;
      },
      {} as Record<string, (VirtualBucket | null)[]>,
    );

    const response: PublicDashboardDataResponse = {
      httpMonitors: monitors.map((monitor) => ({
        name: monitor.name,
        buckets: bucketsByMonitorId[monitor.id],
        pings: pingsByMonitorId[monitor.id].map((ping) => ({
          createdAt: ping.createdAt.toISOString(),
          statusCode: ping.statusCode,
          responseTimeMs: ping.responseTimeMs,
        })),
      })),
    };

    await this.setCachedResponse(publicDashboardId, period, response);

    return response;
  }

  private async getCachedResponse(
    publicDashboardId: string,
    period: BucketsPeriod,
  ): Promise<PublicDashboardDataResponse | null> {
    const cachedResponse = await this.redisService.get(this.getCacheKey(publicDashboardId, period));

    if (cachedResponse) {
      return JSON.parse(cachedResponse) as PublicDashboardDataResponse;
    }

    return null;
  }

  private async setCachedResponse(
    publicDashboardId: string,
    period: BucketsPeriod,
    response: PublicDashboardDataResponse,
  ): Promise<void> {
    await this.redisService.set(
      this.getCacheKey(publicDashboardId, period),
      JSON.stringify(response),
      CACHE_TTL_SECONDS,
    );
  }

  private getCacheKey(publicDashboardId: string, period: BucketsPeriod): string {
    return `public-dashboard:${publicDashboardId}:public-data:${period}`;
  }
}
