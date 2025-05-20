import { Injectable } from '@nestjs/common';
import { ClusterWriteService } from '../write/cluster-write.service';
import { ClusterReadService } from '../read/cluster-read.service';
import { ProjectRemovalService } from '../../project/removal/project-removal.service';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class ClusterRemovalService {
  constructor(
    private readonly clusterReadService: ClusterReadService,
    private readonly clusterWriteService: ClusterWriteService,
    private readonly projectRemovalService: ProjectRemovalService,
    private readonly logger: Logger,
  ) {}

  public async deleteClustersByCreatorId(creatorId: string): Promise<void> {
    const clusters = await this.clusterReadService.readByCreatorId(creatorId);

    for (const cluster of clusters) {
      this.logger.log(`Deleting cluster...`, { clusterId: cluster.id });
      await this.clusterWriteService.delete(cluster.id);

      await this.projectRemovalService.deleteProjectsByClusterId(cluster.id);
    }
  }
}
