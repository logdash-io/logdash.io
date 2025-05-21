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

type ProjectPlan = {
	logs: ProjectPlanLogConfig;
	logMetrics: ProjectPlanLogMetricsConfig;
	metrics: ProjectPlanMetricsConfig;
};

type UserPlanProjectsConfig = {
	maxNumberOfProjects: number;
};

type UserPlanHttpMonitorsConfig = {
	maxNumberOfMonitors: number;
};

type UserPlan = {
	projects: UserPlanProjectsConfig;
	httpMonitors: UserPlanHttpMonitorsConfig;
};

export type ExposedConfig = {
	projectPlanConfigs: Record<UserTier, ProjectPlan>;
	userPlanConfigs: Record<UserTier, UserPlan>;
};
