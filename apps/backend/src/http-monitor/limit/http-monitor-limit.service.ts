import { Injectable } from '@nestjs/common';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { UserReadCachedService } from '../../user/read/user-read-cached.service';
import { getUserPlanConfig } from '../../shared/configs/user-plan-configs';

const MAX_UNCLAIMED_MONITORS_PER_CLUSTER = 3;

@Injectable()
export class HttpMonitorLimitService {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly clusterReadService: ClusterReadService,
    private readonly userReadCachedService: UserReadCachedService,
  ) {}

  public async hasCapacity(clusterId: string): Promise<boolean> {
    const notClaimedMonitorsCount =
      await this.httpMonitorReadService.countNotClaimedByClusterId(clusterId);

    if (notClaimedMonitorsCount + 1 > MAX_UNCLAIMED_MONITORS_PER_CLUSTER) {
      return false;
    }

    return this.hasClaimedCapacity(clusterId);
  }

  public async hasClaimedCapacity(clusterId: string): Promise<boolean> {
    const cluster = await this.clusterReadService.readById(clusterId);

    if (!cluster) {
      return false;
    }

    const tier = await this.userReadCachedService.readTier(cluster.creatorId);
    const allowedCount = getUserPlanConfig(tier).httpMonitors.maxNumberOfMonitors;
    const ownerClusters = await this.clusterReadService.readByCreatorId(cluster.creatorId);
    const claimedMonitorsCount = await this.httpMonitorReadService.countClaimedByClusterIds(
      ownerClusters.map((ownerCluster) => ownerCluster.id),
    );

    return claimedMonitorsCount + 1 <= allowedCount;
  }
}
