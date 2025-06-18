import { Injectable, NotFoundException } from '@nestjs/common';
import { ClusterWriteService } from '../write/cluster-write.service';
import { ClusterReadService } from '../read/cluster-read.service';
import { ProjectRemovalService } from '../../project/removal/project-removal.service';
import { Logger } from '@logdash/js-sdk';
import { PublicDashboardWriteService } from '../../public-dashboard/write/public-dashboard-write.service';

@Injectable()
export class ClusterRemovalService {
  constructor(
    private readonly clusterReadService: ClusterReadService,
    private readonly clusterWriteService: ClusterWriteService,
    private readonly projectRemovalService: ProjectRemovalService,
    private readonly logger: Logger,
    private readonly publicDashboardWriteService: PublicDashboardWriteService,
  ) {}

  public async deleteClustersByCreatorId(creatorId: string): Promise<void> {
    const clusters = await this.clusterReadService.readByCreatorId(creatorId);

    for (const cluster of clusters) {
      this.logger.log(`Deleting cluster...`, { clusterId: cluster.id });
      await this.clusterWriteService.delete(cluster.id);

      await this.projectRemovalService.deleteProjectsByClusterId(cluster.id);
    }
  }

  public async deleteClusterById(clusterId: string): Promise<void> {
    const cluster = await this.clusterReadService.readById(clusterId);

    if (!cluster) {
      throw new NotFoundException('Cluster not found');
    }

    await this.clusterWriteService.delete(clusterId);

    await this.projectRemovalService.deleteProjectsByClusterId(clusterId);

    await this.publicDashboardWriteService.deleteByClusterId(clusterId);
  }
}
