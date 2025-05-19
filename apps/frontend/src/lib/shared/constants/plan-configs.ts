import { UserTier as ProjectOrUserTier } from '../types';

enum MetricGranularity {
	Minute = 'minute',
	Hour = 'hour',
	Day = 'day',
}

const PLAN_CONFIGS = {
	logs: {
		keepLastXLogs: {
			[ProjectOrUserTier.FREE]: 1_000,
			[ProjectOrUserTier.EARLY_BIRD]: 10_000,
		},
		rateLimitPerHour: {
			[ProjectOrUserTier.FREE]: 10_000,
			[ProjectOrUserTier.EARLY_BIRD]: 50_000,
		},
	},
	logMetrics: {
		keepGranularitiesForHours: {
			[MetricGranularity.Minute]: {
				[ProjectOrUserTier.FREE]: 1, // 1 hour
				[ProjectOrUserTier.EARLY_BIRD]: 12, // 12 hours
			},
			[MetricGranularity.Hour]: {
				[ProjectOrUserTier.FREE]: 12, // 12 hours
				[ProjectOrUserTier.EARLY_BIRD]: 7 * 24, // 7 days
			},
			[MetricGranularity.Day]: {
				[ProjectOrUserTier.FREE]: 7 * 24, // 1 week
				[ProjectOrUserTier.EARLY_BIRD]: 30 * 24, // 3 1 month
			},
		},
	},
	projects: {
		maxNumberOfProjects: {
			[ProjectOrUserTier.FREE]: 5,
			[ProjectOrUserTier.EARLY_BIRD]: 20,
		},
	},
};

export const get_logmetric_granularity = (
	tier: ProjectOrUserTier,
	granularity: MetricGranularity,
): number => {
	return PLAN_CONFIGS.logMetrics.keepGranularitiesForHours[granularity][tier];
};

export const get_max_number_of_projects = (tier: ProjectOrUserTier): number => {
	return PLAN_CONFIGS.projects.maxNumberOfProjects[tier];
};
