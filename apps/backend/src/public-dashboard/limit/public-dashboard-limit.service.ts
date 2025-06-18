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

  public async hasCapacity(userId: string): Promise<boolean> {
    const tier = await this.userReadCachedService.readTier(userId);

    const allowedNumberOfPublicDashboards =
      getUserPlanConfig(tier).publicDashboards.maxNumberOfPublicDashboards;

    const userClusters = await this.clusterReadService.readByCreatorId(userId);
    const clusterIds = userClusters.map((cluster) => cluster.id);

    const dashboards = await this.publicDashboardReadService.readByClustersIds(clusterIds);
    const totalDashboards = dashboards.length;

    return totalDashboards + 1 <= allowedNumberOfPublicDashboards;
  }
}
