import { ClusterTier } from '../../cluster/core/enums/cluster-tier.enum';

export interface ClusterPlanConfig {
  maxClusterMembers: number;
}

export interface ClusterPlanConfigs {
  // free
  [ClusterTier.Free]: ClusterPlanConfig;
  [ClusterTier.EarlyUser]: ClusterPlanConfig;

  // paid
  [ClusterTier.EarlyBird]: ClusterPlanConfig;
  [ClusterTier.Builder]: ClusterPlanConfig;
  [ClusterTier.Pro]: ClusterPlanConfig;

  // special
  [ClusterTier.Contributor]: ClusterPlanConfig;
  [ClusterTier.Admin]: ClusterPlanConfig;
}

export const ClusterPlanConfigs: ClusterPlanConfigs = {
  // freee
  [ClusterTier.Free]: {
    maxClusterMembers: 2,
  },
  [ClusterTier.EarlyUser]: {
    maxClusterMembers: 2,
  },

  // paid
  [ClusterTier.EarlyBird]: {
    maxClusterMembers: 3,
  },
  [ClusterTier.Builder]: {
    maxClusterMembers: 3,
  },
  [ClusterTier.Pro]: {
    maxClusterMembers: 4,
  },

  // special
  [ClusterTier.Contributor]: {
    maxClusterMembers: 2,
  },
  [ClusterTier.Admin]: {
    maxClusterMembers: 100,
  },
};

export function getClusterPlanConfig(tier: ClusterTier): ClusterPlanConfig {
  return ClusterPlanConfigs[tier];
}
