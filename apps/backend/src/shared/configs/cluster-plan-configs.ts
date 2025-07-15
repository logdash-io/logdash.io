import { ClusterTier } from '../../cluster/core/enums/cluster-tier.enum';

export interface ClusterPlanConfig {
  maxClusterMembers: number;
  customDomains: {
    canCreate: boolean;
  };
  publicDashboard: {
    hasBuckets: boolean;
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
    publicDashboard: {
      hasBuckets: false,
    },
  },
  [ClusterTier.EarlyUser]: {
    maxClusterMembers: 2,
    customDomains: {
      canCreate: false,
    },
    publicDashboard: {
      hasBuckets: false,
    },
  },

  // paid
  [ClusterTier.EarlyBird]: {
    maxClusterMembers: 3,
    customDomains: {
      canCreate: false,
    },
    publicDashboard: {
      hasBuckets: true,
    },
  },
  [ClusterTier.Builder]: {
    maxClusterMembers: 3,
    customDomains: {
      canCreate: false,
    },
    publicDashboard: {
      hasBuckets: true,
    },
  },
  [ClusterTier.Pro]: {
    maxClusterMembers: 4,
    customDomains: {
      canCreate: true,
    },
    publicDashboard: {
      hasBuckets: true,
    },
  },

  // special
  [ClusterTier.Contributor]: {
    maxClusterMembers: 2,
    customDomains: {
      canCreate: false,
    },
    publicDashboard: {
      hasBuckets: true,
    },
  },
  [ClusterTier.Admin]: {
    maxClusterMembers: 100,
    customDomains: {
      canCreate: true,
    },
    publicDashboard: {
      hasBuckets: true,
    },
  },
};

export function getClusterPlanConfig(tier: ClusterTier): ClusterPlanConfig {
  return ClusterPlanConfigs[tier];
}
