import { Injectable } from '@nestjs/common';
import { ClusterInviteReadService } from '../read/cluster-invite-read.service';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { getClusterPlanConfig } from '../../shared/configs/cluster-plan-configs';

interface ClusterInviteCapacity {
  maxMembers: number;
  currentUsersCount: number;
  currentInvitesCount: number;
}
@Injectable()
export class ClusterInviteLimitService {
  constructor(
    private readonly clusterInviteReadService: ClusterInviteReadService,
    private readonly clusterReadService: ClusterReadService,
  ) {}

  public async hasCapacity(clusterId: string): Promise<boolean> {
    const capacity = await this.getCapacity(clusterId);

    return capacity.currentUsersCount + capacity.currentInvitesCount + 1 <= capacity.maxMembers;
  }

  public async getCapacity(clusterId: string): Promise<ClusterInviteCapacity> {
    const cluster = await this.clusterReadService.readById(clusterId);

    if (!cluster) {
      return {
        maxMembers: 0,
        currentUsersCount: 0,
        currentInvitesCount: 0,
      };
    }

    const maxMembers = getClusterPlanConfig(cluster.tier).maxClusterMembers;

    const currentUsersCount = Object.keys(cluster?.roles ?? {}).length;

    const invites = await this.clusterInviteReadService.readByClusterId(clusterId);

    const currentInvitesCount = invites.length;

    return {
      maxMembers,
      currentUsersCount,
      currentInvitesCount,
    };
  }
}
