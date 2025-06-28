import { Injectable } from '@nestjs/common';
import { ClusterInviteReadService } from '../read/cluster-invite-read.service';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { getClusterPlanConfig } from '../../shared/configs/cluster-plan-configs';
import { ClusterTier } from '../../cluster/core/enums/cluster-tier.enum';

@Injectable()
export class ClusterInviteLimitService {
  constructor(
    private readonly clusterInviteReadService: ClusterInviteReadService,
    private readonly clusterReadService: ClusterReadService,
  ) {}

  public async hasCapacity(clusterId: string): Promise<boolean> {
    const cluster = await this.clusterReadService.readById(clusterId);

    if (!cluster) {
      return false;
    }

    const currentUsersCount = Object.keys(cluster?.roles ?? {}).length;

    const invites = await this.clusterInviteReadService.readByClusterId(clusterId);

    const currentInvitesCount = invites.length;

    const maxMembers = getClusterPlanConfig(cluster.tier).maxClusterMembers;

    return currentUsersCount + currentInvitesCount + 1 <= maxMembers;
  }
}
