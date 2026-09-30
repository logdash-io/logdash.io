import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { subHours } from 'date-fns';
import { HttpMonitorNormalized } from '../../http-monitor/core/entities/http-monitor.interface';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpPingBucketAggregationService } from '../../http-ping-bucket/aggregation/http-ping-bucket-aggregation.service';
import { calculateUptime } from '../../http-ping-bucket/core/calculate-uptime';
import { BucketsPeriod } from '../../http-ping-bucket/core/types/bucket-period.enum';
import { VirtualBucket } from '../../http-ping-bucket/core/types/virtual-bucket.type';
import { HttpPingAggregationService } from '../../http-ping/aggregation/http-ping-aggregation.service';
import { HttpPingNormalized } from '../../http-ping/core/entities/http-ping.interface';
import { MonitorStatus } from '../../http-ping/core/enums/monitor-status.enum';
import { getMonitorStatus } from '../../http-ping/core/get-monitor-status';
import { HttpPingReadService } from '../../http-ping/read/http-ping-read.service';
import { PublicDashboardNormalized } from '../../public-dashboard/core/entities/public-dashboard.interface';
import { PublicDashboardReadService } from '../../public-dashboard/read/public-dashboard-read.service';
import { RedisService } from '../../shared/redis/redis.service';
import { StatusPageDto, StatusPageMonitorDto } from '../core/dto/status-page.dto';
import { StatusPageStatus } from '../core/enums/status-page-status.enum';

const STATUS_PAGE_CACHE_TTL_SECONDS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class StatusPageCompositionService {
  constructor(
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpPingReadService: HttpPingReadService,
    private readonly httpPingAggregationService: HttpPingAggregationService,
    private readonly httpPingBucketAggregationService: HttpPingBucketAggregationService,
    private readonly redisService: RedisService,
  ) {}

  public async composeStatusPage(statusPageId: string): Promise<StatusPageDto> {
    const dashboard = await this.publicDashboardReadService.readByIdOrDomain(statusPageId);

    if (!dashboard) {
      throw new NotFoundException('Status page not found');
    }

    if (!dashboard.isPublic) {
      throw new ForbiddenException('Status page is not public');
    }

    const cacheKey = this.getCacheKey(dashboard.id);
    const cachedStatusPage = await this.redisService.get(cacheKey);

    if (cachedStatusPage) {
      return JSON.parse(cachedStatusPage) as StatusPageDto;
    }

    const statusPage = await this.compose(dashboard);

    await this.redisService.set(
      cacheKey,
      JSON.stringify(statusPage),
      STATUS_PAGE_CACHE_TTL_SECONDS,
    );

    return statusPage;
  }

  public async invalidateCache(publicDashboardId: string): Promise<void> {
    await this.redisService.del(this.getCacheKey(publicDashboardId));
  }

  private async compose(dashboard: PublicDashboardNormalized): Promise<StatusPageDto> {
    const now = new Date();
    const monitors = await this.httpMonitorReadService.readManyByIds(dashboard.httpMonitorsIds);
    const monitorIds = monitors.map((monitor) => monitor.id);

    const [pingsByMonitorId, lastHourByMonitorId, bucketsByMonitor] = await Promise.all([
      this.httpPingReadService.readManyByMonitorIds(monitorIds),
      this.httpPingAggregationService.aggregateByMonitorsForTimeRange(
        monitorIds,
        subHours(now, 1),
        now,
      ),
      Promise.all(monitors.map((monitor) => this.readBuckets(monitor.id))),
    ]);

    const statusPageMonitors = monitors.map((monitor, index) =>
      this.composeMonitor({
        monitor,
        now,
        pings: pingsByMonitorId[monitor.id] ?? [],
        lastHour: lastHourByMonitorId[monitor.id] ?? null,
        ...bucketsByMonitor[index],
      }),
    );

    return {
      name: dashboard.name,
      status: this.getStatusPageStatus(statusPageMonitors.map((monitor) => monitor.status)),
      updatedAt: now.toISOString(),
      monitors: statusPageMonitors,
    };
  }

  private async readBuckets(monitorId: string): Promise<{
    hourlyBuckets: (VirtualBucket | null)[];
    dailyBuckets: (VirtualBucket | null)[];
  }> {
    const [hourlyBuckets, dailyBuckets] = await Promise.all([
      this.httpPingBucketAggregationService.getBucketsForMonitor(monitorId, BucketsPeriod.Day),
      this.httpPingBucketAggregationService.getBucketsForMonitor(
        monitorId,
        BucketsPeriod.NinetyDays,
      ),
    ]);

    return { hourlyBuckets, dailyBuckets };
  }

  private composeMonitor(dto: {
    monitor: HttpMonitorNormalized;
    now: Date;
    pings: HttpPingNormalized[];
    lastHour: { successCount: number; failureCount: number } | null;
    hourlyBuckets: (VirtualBucket | null)[];
    dailyBuckets: (VirtualBucket | null)[];
  }): StatusPageMonitorDto {
    const today = new Date(dto.now);
    today.setUTCHours(0, 0, 0, 0);
    const oldestDay = today.getTime() - (dto.dailyBuckets.length - 1) * DAY_MS;

    return {
      id: dto.monitor.badgeKey,
      name: dto.monitor.name,
      status: getMonitorStatus(dto.pings),
      uptime: {
        '1h': calculateUptime([dto.lastHour]),
        '24h': calculateUptime(dto.hourlyBuckets),
        '7d': calculateUptime(dto.dailyBuckets.slice(0, 7)),
        '30d': calculateUptime(dto.dailyBuckets.slice(0, 30)),
        '90d': calculateUptime(dto.dailyBuckets),
      },
      history: {
        daily: [...dto.dailyBuckets].reverse().map((bucket, index) => ({
          timestamp: new Date(oldestDay + index * DAY_MS).toISOString(),
          successCount: bucket?.successCount ?? 0,
          failureCount: bucket?.failureCount ?? 0,
          averageLatencyMs: bucket?.averageLatencyMs ?? null,
        })),
      },
      pings: [...dto.pings].reverse().map((ping) => ({
        createdAt: ping.createdAt.toISOString(),
        statusCode: ping.statusCode,
        responseTimeMs: ping.responseTimeMs,
      })),
    };
  }

  private getStatusPageStatus(monitorStatuses: MonitorStatus[]): StatusPageStatus {
    const knownStatuses = monitorStatuses.filter((status) => status !== MonitorStatus.Unknown);

    if (knownStatuses.length === 0) {
      return StatusPageStatus.Unknown;
    }

    if (knownStatuses.every((status) => status === MonitorStatus.Down)) {
      return StatusPageStatus.Outage;
    }

    if (knownStatuses.some((status) => status !== MonitorStatus.Up)) {
      return StatusPageStatus.Degraded;
    }

    return StatusPageStatus.Operational;
  }

  private getCacheKey(publicDashboardId: string): string {
    return `status-page:v1:${publicDashboardId}`;
  }
}
