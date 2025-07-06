import type { UserTier } from '$lib/domains/shared/types.js';

export enum NotificationChannelType {
  TELEGRAM = 'telegram',
  WEBHOOK = 'webhook',
  EMAIL = 'email',
}

type GranularityHours = {
  minute: number;
  hour: number;
  day: number;
};

type ProjectPlanLogConfig = {
  keepLastXLogs: number;
  rateLimitPerHour: number;
  retentionHours: number;
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

type UserPlanNotificationChannelsConfig = {
  allowedTypes: NotificationChannelType[];
};

type UserPlan = {
  projects: UserPlanProjectsConfig;
  publicDashboards: UserPlanPublicDashboardsConfig;
  notificationChannels: UserPlanNotificationChannelsConfig;
};

export type ExposedConfig = {
  projectPlanConfigs: Record<UserTier, ProjectPlan>;
  userPlanConfigs: Record<UserTier, UserPlan>;
};
