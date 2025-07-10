import { ClusterTier } from '../../cluster/core/enums/cluster-tier.enum';

export interface ClusterPlanConfig {
  maxClusterMembers: number;
  customDomains: {
    canCreate: boolean;
  };
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
  // free
  [ClusterTier.Free]: {
    maxClusterMembers: 2,
    customDomains: {
      canCreate: false,
    },
  },
  [ClusterTier.EarlyUser]: {
    maxClusterMembers: 2,
    customDomains: {
      canCreate: false,
    },
  },

  // paid
  [ClusterTier.EarlyBird]: {
    maxClusterMembers: 3,
    customDomains: {
      canCreate: false,
    },
  },
  [ClusterTier.Builder]: {
    maxClusterMembers: 3,
    customDomains: {
      canCreate: false,
    },
  },
  [ClusterTier.Pro]: {
    maxClusterMembers: 4,
    customDomains: {
      canCreate: true,
    },
  },

  // special
  [ClusterTier.Contributor]: {
    maxClusterMembers: 2,
    customDomains: {
      canCreate: false,
    },
  },
  [ClusterTier.Admin]: {
    maxClusterMembers: 100,
    customDomains: {
      canCreate: true,
    },
  },
};

export function getClusterPlanConfig(tier: ClusterTier): ClusterPlanConfig {
  return ClusterPlanConfigs[tier];
}
