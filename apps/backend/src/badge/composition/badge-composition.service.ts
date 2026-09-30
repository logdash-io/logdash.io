import { Injectable, NotFoundException } from '@nestjs/common';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
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
import { MonitorStatus } from '../../http-ping/core/enums/monitor-status.enum';
import { getMonitorStatus, RECENT_PINGS_COUNT } from '../../http-ping/core/get-monitor-status';
import { calculateUptime } from '../../http-ping-bucket/core/calculate-uptime';
import { BadgeStyle } from '../core/enums/badge-style.enum';
import { renderBadge } from '../render/badge-renderer';
import { ComposeBadgeDto } from './dto/compose-badge.dto';

const BADGE_CACHE_TTL_SECONDS = 60;

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
      dto.style === BadgeStyle.Classic ? MonitorStatus.Unknown : this.readStatus(monitor.id),
      dto.style === BadgeStyle.Classic ? this.readPeriodUptime(monitor.id, dto.period) : null,
      dto.style === BadgeStyle.Card ? this.readDailyBuckets(monitor.id) : [],
    ]);

    const badge = renderBadge({
      style: dto.style,
      theme: dto.theme,
      name: monitor.name,
      status,
      uptime: periodUptime ? periodUptime.uptime : calculateUptime(dailyBuckets),
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
    const dashboard =
      await this.publicDashboardReadService.readByIdOrDomain(publicDashboardIdOrDomain);

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

  private async readStatus(monitorId: string): Promise<MonitorStatus> {
    return getMonitorStatus(
      await this.httpPingReadService.readByMonitorId(monitorId, RECENT_PINGS_COUNT),
    );
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
      uptime: calculateUptime(periodBuckets),
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
}
