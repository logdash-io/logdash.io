import { Injectable } from '@nestjs/common';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { getUserPlanConfig } from '../../shared/configs/user-plan-configs';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';

@Injectable()
export class HttpMonitorLimitService {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly clusterReadCachedService: ClusterReadCachedService,
  ) {}

  public async hasCapacity(clusterId: string): Promise<boolean> {
    const monitorsCount = await this.httpMonitorReadService.countBelongingToCluster(clusterId);
    const tier = await this.clusterReadCachedService.readTier(clusterId);
    const allowedCount = getUserPlanConfig(tier as unknown as UserTier).httpMonitors.maxNumberOfMonitors;

    return monitorsCount + 1 <= allowedCount;
  }
}
