import { ClusterTier } from '../../cluster/core/enums/cluster-tier.enum';

export interface ClusterPlanConfig {
  maxClusterMembers: number;
}

export interface ClusterPlanConfigs {
  [ClusterTier.Free]: ClusterPlanConfig;
  [ClusterTier.Contributor]: ClusterPlanConfig;
  [ClusterTier.EarlyBird]: ClusterPlanConfig;
  [ClusterTier.Admin]: ClusterPlanConfig;
}

export const ClusterPlanConfigs: ClusterPlanConfigs = {
  [ClusterTier.Free]: {
    maxClusterMembers: 2,
  },
  [ClusterTier.Contributor]: {
    maxClusterMembers: 3,
  },
  [ClusterTier.EarlyBird]: {
    maxClusterMembers: 4,
  },
  [ClusterTier.Admin]: {
    maxClusterMembers: 100,
  },
};

export function getClusterPlanConfig(tier: ClusterTier): ClusterPlanConfig {
  return ClusterPlanConfigs[tier];
}
