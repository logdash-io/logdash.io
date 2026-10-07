import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClusterWriteService } from '../write/cluster-write.service';
import { ClusterReadService } from '../read/cluster-read.service';
import { ProjectRemovalService } from '../../project/removal/project-removal.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { CLUSTERS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { PublicDashboardRemovalService } from '../../public-dashboard/removal/public-dashboard-removal.service';
import { WebAnalyticsWriteService } from '../../web-analytics/write/web-analytics-write.service';
import { HttpMonitorRemovalService } from '../../http-monitor/removal/http-monitor-removal.service';
import { NotificationChannelWriteService } from '../../notification-channel/write/notification-channel-write.service';

@Injectable()
export class ClusterRemovalService {
  constructor(
    private readonly clusterReadService: ClusterReadService,
    private readonly clusterWriteService: ClusterWriteService,
    private readonly projectRemovalService: ProjectRemovalService,
    @Inject(CLUSTERS_LOGGER) private readonly logger: LogdashLogger,
    private readonly publicDashboardRemovalService: PublicDashboardRemovalService,
    private readonly webAnalyticsWriteService: WebAnalyticsWriteService,
    private readonly httpMonitorRemovalService: HttpMonitorRemovalService,
    private readonly notificationChannelWriteService: NotificationChannelWriteService,
  ) {}

  public async deleteClustersByCreatorId(creatorId: string): Promise<void> {
    const clusters = await this.clusterReadService.readByCreatorId(creatorId);

    for (const cluster of clusters) {
      this.logger.log(`Deleting cluster...`, { clusterId: cluster.id });
      await this.deleteClusterData(cluster.id);
    }
  }

  public async deleteClusterById(clusterId: string, actorUserId?: string): Promise<void> {
    const cluster = await this.clusterReadService.readById(clusterId);

    if (!cluster) {
      throw new NotFoundException('Domain not found');
    }

    await this.deleteClusterData(clusterId, actorUserId);
  }

  private async deleteClusterData(clusterId: string, actorUserId?: string): Promise<void> {
    await this.webAnalyticsWriteService.deleteByClusterId(clusterId);
    await this.clusterWriteService.delete(clusterId, actorUserId);
    await this.projectRemovalService.deleteProjectsByClusterId(clusterId, actorUserId);
    await this.httpMonitorRemovalService.deleteByClusterId(clusterId, actorUserId);
    await this.publicDashboardRemovalService.deletePublicDashboardsByClusterId(clusterId);
    await this.notificationChannelWriteService.deleteByClusterId(clusterId);
  }
}
