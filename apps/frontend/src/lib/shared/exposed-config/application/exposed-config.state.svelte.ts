import type { UserTier } from '$lib/shared/types.js';
import type { ExposedConfig } from '../domain/exposed-config.js';

// todo: divide api calls responsibility from state
class ExposedConfigState {
	private _config = $state<ExposedConfig>();

	set(config: ExposedConfig): void {
		this._config = config;
	}

	logsHourlyRateLimit(tier: UserTier): number {
		if (!this._config) {
			return 0;
		}

		return this._config.projectPlanConfigs[tier].logs.rateLimitPerHour ?? 0;
	}

	maxRegisteredMetrics(tier: UserTier): number {
		if (!this._config) {
			return 0;
		}

		return (
			this._config.projectPlanConfigs[tier].metrics
				.maxMetricsRegisterEntries ?? 0
		);
	}

	maxNumberOfProjects(tier: UserTier): number {
		if (!this._config) {
			return 0;
		}

		return (
			this._config.userPlanConfigs[tier].projects.maxNumberOfProjects ?? 0
		);
	}
}

export const exposedConfigState = new ExposedConfigState();
