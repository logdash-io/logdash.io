import { Injectable } from '@nestjs/common';
import { HttpMonitorNormalized } from '../../http-monitor/core/entities/http-monitor.interface';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { PublicDashboardReadService } from '../read/public-dashboard-read.service';
import { PublicDashboardWriteService } from '../write/public-dashboard-write.service';
import { PublicDashboardLimitService } from '../limit/public-dashboard-limit.service';
import { PublicDashboardCompositionService } from '../composition/public-dashboard-composition.service';
import { StatusPageCompositionService } from '../../status-page/composition/status-page-composition.service';

@Injectable()
export class PublicDashboardMonitorsService {
  constructor(
    private readonly clusterReadService: ClusterReadService,
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly publicDashboardWriteService: PublicDashboardWriteService,
    private readonly publicDashboardLimitService: PublicDashboardLimitService,
    private readonly publicDashboardCompositionService: PublicDashboardCompositionService,
    private readonly statusPageCompositionService: StatusPageCompositionService,
  ) {}

  public async createDefaultDashboard(clusterId: string): Promise<void> {
    if (!(await this.publicDashboardLimitService.hasCapacity(clusterId))) {
      return;
    }

    const cluster = await this.clusterReadService.readByIdOrThrow(clusterId);

    await this.publicDashboardWriteService.create({
      clusterId,
      httpMonitorsIds: [],
      name: cluster.name,
      isPublic: false,
      autoAddMonitors: true,
    });
  }

  public async addClaimedMonitor(monitor: HttpMonitorNormalized): Promise<void> {
    const dashboards = await this.publicDashboardReadService.readByClusterId(monitor.clusterId);

    await this.publicDashboardWriteService.addMonitorToAutoAddDashboards(
      monitor.clusterId,
      monitor.id,
    );
    await this.invalidate(
      dashboards.filter((dashboard) => dashboard.autoAddMonitors).map((dashboard) => dashboard.id),
    );
  }

  public async removeMonitor(httpMonitorId: string): Promise<void> {
    const dashboards = await this.publicDashboardReadService.readByHttpMonitorId(httpMonitorId);

    if (dashboards.length === 0) {
      return;
    }

    await this.publicDashboardWriteService.removeMonitorFromAllDashboards(httpMonitorId);
    await this.invalidate(dashboards.map((dashboard) => dashboard.id));
  }

  private async invalidate(publicDashboardIds: string[]): Promise<void> {
    for (const publicDashboardId of publicDashboardIds) {
      await this.publicDashboardCompositionService.invalidateCache(publicDashboardId);
      await this.statusPageCompositionService.invalidateCache(publicDashboardId);
    }
  }
}
