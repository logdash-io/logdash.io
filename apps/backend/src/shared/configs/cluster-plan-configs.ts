import { HttpPingCron } from '../../http-ping/core/enums/http-ping-cron.enum';
import { ClusterTier } from '../../cluster/core/enums/cluster-tier.enum';

export interface ClusterPlanConfig {
  maxClusterMembers: number;
  webAnalytics: {
    rateLimitPerHour: number;
    retentionDays: number;
  };
  customDomains: {
    canCreate: boolean;
  };
  publicDashboard: {
    hasBuckets: boolean;
  };
  httpMonitors: {
    pingFrequency: HttpPingCron;
    canCreatePushMonitors: boolean;
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
    webAnalytics: { rateLimitPerHour: 10_000, retentionDays: 90 },
    customDomains: {
      canCreate: false,
    },
    publicDashboard: {
      hasBuckets: false,
    },
    httpMonitors: {
      pingFrequency: HttpPingCron.Every5Minutes,
      canCreatePushMonitors: false,
    },
  },
  [ClusterTier.EarlyUser]: {
    maxClusterMembers: 2,
    webAnalytics: { rateLimitPerHour: 10_000, retentionDays: 90 },
    customDomains: {
      canCreate: false,
    },
    publicDashboard: {
      hasBuckets: false,
    },
    httpMonitors: {
      pingFrequency: HttpPingCron.Every5Minutes,
      canCreatePushMonitors: false,
    },
  },

  // paid
  [ClusterTier.EarlyBird]: {
    maxClusterMembers: 3,
    webAnalytics: { rateLimitPerHour: 50_000, retentionDays: 365 },
    customDomains: {
      canCreate: false,
    },
    publicDashboard: {
      hasBuckets: true,
    },
    httpMonitors: {
      pingFrequency: HttpPingCron.Every5Minutes,
      canCreatePushMonitors: false,
    },
  },
  [ClusterTier.Builder]: {
    maxClusterMembers: 3,
    webAnalytics: { rateLimitPerHour: 25_000, retentionDays: 180 },
    customDomains: {
      canCreate: false,
    },
    publicDashboard: {
      hasBuckets: true,
    },
    httpMonitors: {
      pingFrequency: HttpPingCron.EveryMinute,
      canCreatePushMonitors: false,
    },
  },
  [ClusterTier.Pro]: {
    maxClusterMembers: 4,
    webAnalytics: { rateLimitPerHour: 50_000, retentionDays: 365 },
    customDomains: {
      canCreate: true,
    },
    publicDashboard: {
      hasBuckets: true,
    },
    httpMonitors: {
      pingFrequency: HttpPingCron.Every15Seconds,
      canCreatePushMonitors: true,
    },
  },

  // special
  [ClusterTier.Contributor]: {
    maxClusterMembers: 2,
    webAnalytics: { rateLimitPerHour: 50_000, retentionDays: 180 },
    customDomains: {
      canCreate: false,
    },
    publicDashboard: {
      hasBuckets: true,
    },
    httpMonitors: {
      pingFrequency: HttpPingCron.Every5Minutes,
      canCreatePushMonitors: false,
    },
  },
  [ClusterTier.Admin]: {
    maxClusterMembers: 100,
    webAnalytics: { rateLimitPerHour: 50_000, retentionDays: 365 },
    customDomains: {
      canCreate: true,
    },
    publicDashboard: {
      hasBuckets: true,
    },
    httpMonitors: {
      pingFrequency: HttpPingCron.EveryMinute,
      canCreatePushMonitors: true,
    },
  },
};

export function getClusterPlanConfig(tier: ClusterTier): ClusterPlanConfig {
  return ClusterPlanConfigs[tier];
}
