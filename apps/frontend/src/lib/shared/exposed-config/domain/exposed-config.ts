import type { UserTier } from '$lib/shared/types.js';

type GranularityHours = {
  minute: number;
  hour: number;
  day: number;
};

type ProjectPlanLogConfig = {
  keepLastXLogs: number;
  rateLimitPerHour: number;
};

type ProjectPlanLogMetricsConfig = {
  keepGranularitiesForHours: GranularityHours;
};

type ProjectPlanMetricsConfig = {
  maxMetricsRegisterEntries: number;
  keepGranularitiesForHours: GranularityHours;
};

type ProjectPlanHttpMonitorsConfig = {
  maxNumberOfMonitors: number;
};

type ProjectPlan = {
  logs: ProjectPlanLogConfig;
  logMetrics: ProjectPlanLogMetricsConfig;
  metrics: ProjectPlanMetricsConfig;
  httpMonitors: ProjectPlanHttpMonitorsConfig;
};

type UserPlanProjectsConfig = {
  maxNumberOfProjects: number;
};

type UserPlanPublicDashboardsConfig = {
  maxNumberOfPublicDashboards: number;
};

type UserPlan = {
  projects: UserPlanProjectsConfig;
  publicDashboards: UserPlanPublicDashboardsConfig;
};

export type ExposedConfig = {
  projectPlanConfigs: Record<UserTier, ProjectPlan>;
  userPlanConfigs: Record<UserTier, UserPlan>;
};
