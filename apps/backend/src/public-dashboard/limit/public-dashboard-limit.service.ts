import { Injectable } from '@nestjs/common';
import { PublicDashboardReadService } from '../read/public-dashboard-read.service';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { UserReadCachedService } from '../../user/read/user-read-cached.service';
import { getUserPlanConfig } from '../../shared/configs/user-plan-configs';

@Injectable()
export class PublicDashboardLimitService {
  constructor(
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly clusterReadService: ClusterReadService,
    private readonly userReadCachedService: UserReadCachedService,
  ) {}

  public async hasCapacity(clusterId: string): Promise<boolean> {
    const { creatorId } = await this.clusterReadService.readByIdOrThrow(clusterId);
    const tier = await this.userReadCachedService.readTier(creatorId);

    const allowedNumberOfPublicDashboards =
      getUserPlanConfig(tier).publicDashboards.maxNumberOfPublicDashboards;

    const ownerClusters = await this.clusterReadService.readByCreatorId(creatorId);
    const clusterIds = ownerClusters.map((cluster) => cluster.id);

    const dashboards = await this.publicDashboardReadService.readByClustersIds(clusterIds);

    return dashboards.length + 1 <= allowedNumberOfPublicDashboards;
  }
}
