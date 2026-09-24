import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { CustomDomainReadService } from '../../custom-domain/read/custom-domain-read.service';
import { HttpMonitorNormalized } from '../../http-monitor/core/entities/http-monitor.interface';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpPingBucketAggregationService } from '../../http-ping-bucket/aggregation/http-ping-bucket-aggregation.service';
import { BucketsPeriod } from '../../http-ping-bucket/core/types/bucket-period.enum';
import { VirtualBucket } from '../../http-ping-bucket/core/types/virtual-bucket.type';
import { HttpPingReadService } from '../../http-ping/read/http-ping-read.service';
import { PublicDashboardNormalized } from '../../public-dashboard/core/entities/public-dashboard.interface';
import { PublicDashboardReadService } from '../../public-dashboard/read/public-dashboard-read.service';
import { getClusterPlanConfig } from '../../shared/configs/cluster-plan-configs';
import { RedisService } from '../../shared/redis/redis.service';
import { BadgePeriod } from '../core/enums/badge-period.enum';
import { BadgeStatus } from '../core/enums/badge-status.enum';
import { BadgeStyle } from '../core/enums/badge-style.enum';
import { renderBadge } from '../render/badge-renderer';
import { ComposeBadgeDto } from './dto/compose-badge.dto';

const BADGE_CACHE_TTL_SECONDS = 60;
const RECENT_PINGS_COUNT = 10;

const PERIOD_WINDOWS: Record<
  BadgePeriod,
  { bucketsPeriod: BucketsPeriod; bucketCount: number; unit: string }
> = {
  [BadgePeriod.Day]: { bucketsPeriod: BucketsPeriod.Day, bucketCount: 24, unit: 'h' },
  [BadgePeriod.SevenDays]: { bucketsPeriod: BucketsPeriod.NinetyDays, bucketCount: 7, unit: 'd' },
  [BadgePeriod.ThirtyDays]: { bucketsPeriod: BucketsPeriod.NinetyDays, bucketCount: 30, unit: 'd' },
  [BadgePeriod.NinetyDays]: { bucketsPeriod: BucketsPeriod.NinetyDays, bucketCount: 90, unit: 'd' },
};

@Injectable()
export class BadgeCompositionService {
  constructor(
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly customDomainReadService: CustomDomainReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly clusterReadCachedService: ClusterReadCachedService,
    private readonly httpPingReadService: HttpPingReadService,
    private readonly httpPingBucketAggregationService: HttpPingBucketAggregationService,
    private readonly redisService: RedisService,
  ) {}

  public async composeBadge(dto: ComposeBadgeDto): Promise<string> {
    const cacheKey = `badge:${dto.publicDashboardIdOrDomain}:${dto.badgeKey}:${dto.style}:${dto.period}:${dto.theme}`;
    const cachedBadge = await this.redisService.get(cacheKey);

    if (cachedBadge) {
      return cachedBadge;
    }

    const dashboard = await this.readPublicDashboard(dto.publicDashboardIdOrDomain);
    const monitor = await this.readDashboardMonitor(dashboard, dto.badgeKey);
    const clusterTier = await this.clusterReadCachedService.readTier(dashboard.clusterId);

    const [status, periodUptime, dailyBuckets] = await Promise.all([
      dto.style === BadgeStyle.Classic ? BadgeStatus.Unknown : this.readStatus(monitor.id),
      dto.style === BadgeStyle.Classic ? this.readPeriodUptime(monitor.id, dto.period) : null,
      dto.style === BadgeStyle.Card ? this.readDailyBuckets(monitor.id) : [],
    ]);

    const badge = renderBadge({
      style: dto.style,
      theme: dto.theme,
      name: monitor.name,
      status,
      uptime: periodUptime ? periodUptime.uptime : this.calculateUptime(dailyBuckets),
      periodLabel: periodUptime ? periodUptime.periodLabel : dto.period,
      dailyBuckets,
      isWhiteLabel: getClusterPlanConfig(clusterTier).customDomains.canCreate,
    });

    await this.redisService.set(cacheKey, badge, BADGE_CACHE_TTL_SECONDS);

    return badge;
  }

  private async readPublicDashboard(
    publicDashboardIdOrDomain: string,
  ): Promise<PublicDashboardNormalized> {
    const publicDashboardId = Types.ObjectId.isValid(publicDashboardIdOrDomain)
      ? publicDashboardIdOrDomain
      : (await this.customDomainReadService.readByDomain(publicDashboardIdOrDomain))
          ?.publicDashboardId;

    const dashboard = publicDashboardId
      ? await this.publicDashboardReadService.readById(publicDashboardId)
      : null;

    if (!dashboard || !dashboard.isPublic) {
      throw new NotFoundException('Badge not found');
    }

    return dashboard;
  }

  private async readDashboardMonitor(
    dashboard: PublicDashboardNormalized,
    badgeKey: string,
  ): Promise<HttpMonitorNormalized> {
    const monitors = await this.httpMonitorReadService.readManyByIds(dashboard.httpMonitorsIds);
    const monitor = monitors.find((candidate) => candidate.badgeKey === badgeKey);

    if (!monitor) {
      throw new NotFoundException('Badge not found');
    }

    return monitor;
  }

  private async readStatus(monitorId: string): Promise<BadgeStatus> {
    const pings = await this.httpPingReadService.readByMonitorId(monitorId, RECENT_PINGS_COUNT);

    if (pings.length === 0) {
      return BadgeStatus.Unknown;
    }

    const isHealthy = (statusCode: number): boolean => statusCode >= 200 && statusCode < 400;

    if (!isHealthy(pings[0].statusCode)) {
      return BadgeStatus.Down;
    }

    if (pings.some((ping) => !isHealthy(ping.statusCode))) {
      return BadgeStatus.Degraded;
    }

    return BadgeStatus.Up;
  }

  private async readPeriodUptime(
    monitorId: string,
    period: BadgePeriod,
  ): Promise<{ uptime: number | null; periodLabel: string }> {
    const window = PERIOD_WINDOWS[period];
    const buckets = await this.httpPingBucketAggregationService.getBucketsForMonitor(
      monitorId,
      window.bucketsPeriod,
    );
    const periodBuckets = buckets.slice(0, window.bucketCount);
    const coveredBucketCount = periodBuckets.map((bucket) => bucket !== null).lastIndexOf(true) + 1;

    return {
      uptime: this.calculateUptime(periodBuckets),
      periodLabel: coveredBucketCount === 0 ? period : `${coveredBucketCount}${window.unit}`,
    };
  }

  private async readDailyBuckets(monitorId: string): Promise<(VirtualBucket | null)[]> {
    const buckets = await this.httpPingBucketAggregationService.getBucketsForMonitor(
      monitorId,
      BucketsPeriod.NinetyDays,
    );

    return [...buckets].reverse();
  }

  private calculateUptime(buckets: (VirtualBucket | null)[]): number | null {
    const presentBuckets = buckets.filter((bucket) => bucket !== null);
    const successCount = presentBuckets.reduce((sum, bucket) => sum + bucket.successCount, 0);
    const totalCount = presentBuckets.reduce(
      (sum, bucket) => sum + bucket.successCount + bucket.failureCount,
      0,
    );

    return totalCount === 0 ? null : (successCount / totalCount) * 100;
  }
}
