import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { ProjectTier } from '../../project/core/enums/project-tier.enum';

export interface ProjectPlanConfig {
  logs: {
    keepLastXLogs: number;
    rateLimitPerHour: number;
  };
  logMetrics: {
    keepGranularitiesForHours: {
      [MetricGranularity.Minute]: number;
      [MetricGranularity.Hour]: number;
      [MetricGranularity.Day]: number;
    };
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
  };
}

export interface ProjectPlanConfigs {
  [ProjectTier.Free]: ProjectPlanConfig;
  [ProjectTier.Contributor]: ProjectPlanConfig;
  [ProjectTier.EarlyBird]: ProjectPlanConfig;
  [ProjectTier.Admin]: ProjectPlanConfig;
}

export const ProjectPlanConfigs: ProjectPlanConfigs = {
  [ProjectTier.Free]: {
    logs: {
      keepLastXLogs: 1_000,
      rateLimitPerHour: 10_000,
    },
    logMetrics: {
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 1, // 1 hour
        [MetricGranularity.Hour]: 12, // 12 hours
        [MetricGranularity.Day]: 7 * 24, // 7 days
      },
    },
    metrics: {
      maxMetricsRegisterEntries: 2,
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 1, // 1 hour
        [MetricGranularity.Hour]: 12, // 12 hours
        [MetricGranularity.Day]: 7 * 24, // 7 days
      },
    },
    httpMonitors: {
      maxNumberOfMonitors: 2,
    },
  },
  [ProjectTier.Contributor]: {
    logs: {
      keepLastXLogs: 5_000,
      rateLimitPerHour: 25_000,
    },
    logMetrics: {
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 6, // 6 hours
        [MetricGranularity.Hour]: 3 * 24, // 3 days
        [MetricGranularity.Day]: 14 * 24, // 14 days
      },
    },
    metrics: {
      maxMetricsRegisterEntries: 5,
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 6, // 6 hours
        [MetricGranularity.Hour]: 3 * 24, // 3 days
        [MetricGranularity.Day]: 14 * 24, // 14 days
      },
    },
    httpMonitors: {
      maxNumberOfMonitors: 5,
    },
  },
  [ProjectTier.EarlyBird]: {
    logs: {
      keepLastXLogs: 10_000,
      rateLimitPerHour: 50_000,
    },
    logMetrics: {
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 12, // 12 hours
        [MetricGranularity.Hour]: 7 * 24, // 7 days
        [MetricGranularity.Day]: 30 * 24, // 1 month
      },
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
      maxNumberOfMonitors: 10,
    },
  },
  [ProjectTier.Admin]: {
    logs: {
      keepLastXLogs: 10_000,
      rateLimitPerHour: 50_000,
    },
    logMetrics: {
      keepGranularitiesForHours: {
        [MetricGranularity.Minute]: 12, // 12 hours
        [MetricGranularity.Hour]: 7 * 24, // 7 days
        [MetricGranularity.Day]: 30 * 24, // 1 month
      },
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
    },
  },
};

export function getProjectPlanConfig(tier: ProjectTier): ProjectPlanConfig {
  return ProjectPlanConfigs[tier];
}
