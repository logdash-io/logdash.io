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
    maxClusterMembers: 1,
  },
  [ClusterTier.Contributor]: {
    maxClusterMembers: 2,
  },
  [ClusterTier.EarlyBird]: {
    maxClusterMembers: 2,
  },
  [ClusterTier.Admin]: {
    maxClusterMembers: 100,
  },
};

export function getClusterPlanConfig(tier: ClusterTier): ClusterPlanConfig {
  return ClusterPlanConfigs[tier];
}
