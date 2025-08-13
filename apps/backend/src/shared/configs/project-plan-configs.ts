import { HttpPingCron } from '../../http-ping/core/enums/http-ping-cron.enum';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { ProjectTier } from '../../project/core/enums/project-tier.enum';

export interface ProjectPlanConfig {
  logs: {
    rateLimitPerHour: number;
    retentionHours: number;
  };
  metrics: {
    maxMetricsRegisterEntries: number;
    keepGranularitiesForHours: {
      [MetricGranularity.Minute]: number;
      [MetricGranularity.Hour]: number;
      [MetricGranularity.Day]: number;
    };
  };
  httpMonitors: {
    maxNumberOfMonitors: number;
    pingFrequency: HttpPingCron;
    canDisplayBuckets: boolean;
    canCreatePushMonitors: boolean;
  };
}

export interface ProjectPlanConfigs {
  // free
  [ProjectTier.Free]: ProjectPlanConfig;
  [ProjectTier.EarlyUser]: ProjectPlanConfig;

  // paid
  [ProjectTier.EarlyBird]: ProjectPlanConfig;
  [ProjectTier.Builder]: ProjectPlanConfig;
  [ProjectTier.Pro]: ProjectPlanConfig;

  // special
  [ProjectTier.Contributor]: ProjectPlanConfig;
  [ProjectTier.Admin]: ProjectPlanConfig;
}

export const ProjectPlanConfigs: ProjectPlanConfigs = {
  // free
  [ProjectTier.Free]: {
    logs: {
      rateLimitPerHour: 10_000,
      retentionHours: 24, // 1 day
    },
    metrics: {
      maxMetricsRegisterEntries: 5,
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 1, // 1 hour
        [MetricGranularity.Hour]: 24, // 1 day
        [MetricGranularity.Day]: 0, // 0 hours
      },
    },
    httpMonitors: {
      maxNumberOfMonitors: 1,
      pingFrequency: HttpPingCron.Every5Minutes,
      canDisplayBuckets: false,
      canCreatePushMonitors: false,
    },
  },
  [ProjectTier.EarlyUser]: {
    logs: {
      rateLimitPerHour: 10_000,
      retentionHours: 24 * 7, // 7 days
    },
    metrics: {
      maxMetricsRegisterEntries: 5,
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 1, // 1 hour
        [MetricGranularity.Hour]: 12, // 12 hours
        [MetricGranularity.Day]: 7 * 24, // 7 days
      },
    },
    httpMonitors: {
      maxNumberOfMonitors: 1,
      pingFrequency: HttpPingCron.Every5Minutes,
      canDisplayBuckets: false,
      canCreatePushMonitors: false,
    },
  },

  // paid
  [ProjectTier.EarlyBird]: {
    logs: {
      rateLimitPerHour: 50_000,
      retentionHours: 24 * 30, // 30 days
    },
    metrics: {
      maxMetricsRegisterEntries: 10,
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 12, // 12 hours
        [MetricGranularity.Hour]: 7 * 24, // 7 days
        [MetricGranularity.Day]: 30 * 24, // 1 month
      },
    },
    httpMonitors: {
      maxNumberOfMonitors: 1,
      pingFrequency: HttpPingCron.Every5Minutes,
      canDisplayBuckets: true,
      canCreatePushMonitors: false,
    },
  },
  [ProjectTier.Builder]: {
    logs: {
      rateLimitPerHour: 25_000,
      retentionHours: 24 * 7, // 7 days
    },
    metrics: {
      maxMetricsRegisterEntries: 10,
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 6, // 6 hours
        [MetricGranularity.Hour]: 3 * 24, // 3 days
        [MetricGranularity.Day]: 7 * 24, // 7 days
      },
    },
    httpMonitors: {
      maxNumberOfMonitors: 1,
      pingFrequency: HttpPingCron.EveryMinute,
      canDisplayBuckets: true,
      canCreatePushMonitors: false,
    },
  },
  [ProjectTier.Pro]: {
    logs: {
      rateLimitPerHour: 50_000,
      retentionHours: 24 * 30, // 30 days
    },
    metrics: {
      maxMetricsRegisterEntries: 30,
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 24, // 1 day
        [MetricGranularity.Hour]: 7 * 24, // 7 days
        [MetricGranularity.Day]: 30 * 24, // 30 days
      },
    },
    httpMonitors: {
      maxNumberOfMonitors: 1,
      pingFrequency: HttpPingCron.Every15Seconds,
      canDisplayBuckets: true,
      canCreatePushMonitors: true,
    },
  },

  // special
  [ProjectTier.Contributor]: {
    logs: {
      rateLimitPerHour: 50_000,
      retentionHours: 24 * 7, // 7 days
    },

    metrics: {
      maxMetricsRegisterEntries: 10,
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 12, // 12 hours
        [MetricGranularity.Hour]: 7 * 24, // 7 days
        [MetricGranularity.Day]: 30 * 24, // 30 days
      },
    },
    httpMonitors: {
      maxNumberOfMonitors: 1,
      pingFrequency: HttpPingCron.Every5Minutes,
      canDisplayBuckets: true,
      canCreatePushMonitors: false,
    },
  },
  [ProjectTier.Admin]: {
    logs: {
      rateLimitPerHour: 50_000,
      retentionHours: 24 * 30, // 30 days
    },
    metrics: {
      maxMetricsRegisterEntries: 50,
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 12, // 12 hours
        [MetricGranularity.Hour]: 7 * 24, // 7 days
        [MetricGranularity.Day]: 30 * 24, // 1 month
      },
    },
    httpMonitors: {
      maxNumberOfMonitors: 100,
      pingFrequency: HttpPingCron.EveryMinute,
      canDisplayBuckets: true,
      canCreatePushMonitors: true,
    },
  },
};

export function getProjectPlanConfig(tier: ProjectTier): ProjectPlanConfig {
  return ProjectPlanConfigs[tier];
}
