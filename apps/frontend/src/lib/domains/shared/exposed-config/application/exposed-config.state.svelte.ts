import { UserTier } from '$lib/domains/shared/types.js';
import type {
  ExposedConfig,
  NotificationChannelType,
} from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
import { match } from 'ts-pattern';

// todo: divide api calls responsibility from state
class ExposedConfigState {
  config = $state<ExposedConfig | undefined>();

  set(config: ExposedConfig): void {
    this.config = config;
  }

  logsHourlyRateLimit(tier: UserTier): number {
    if (!this.config) {
      return 0;
    }

    return this.config.projectPlanConfigs[tier].logs.rateLimitPerHour ?? 0;
  }

  maxRegisteredMetrics(tier: UserTier): number {
    if (!this.config) {
      return 0;
    }

    return (
      this.config.projectPlanConfigs[tier].metrics.maxMetricsRegisterEntries ??
      0
    );
  }

  maxNumberOfProjects(tier: UserTier): number {
    if (!this.config) {
      return 0;
    }

    return this.config.userPlanConfigs[tier].projects.maxNumberOfProjects ?? 0;
  }

  maxNumberOfPublicDashboards(tier: UserTier): number {
    if (!this.config) {
      return 0;
    }

    return (
      this.config.userPlanConfigs[tier].publicDashboards
        .maxNumberOfPublicDashboards ?? 0
    );
  }

  maxNumberOfHttpMonitors(tier: UserTier): number {
    if (!this.config) {
      return 0;
    }

    return (
      this.config.projectPlanConfigs[tier].httpMonitors.maxNumberOfMonitors ?? 0
    );
  }

  allowedNotificationChannels(tier: UserTier): NotificationChannelType[] {
    if (!this.config) {
      return [];
    }

    const tierConfig = this.config.userPlanConfigs[tier];
    if (!tierConfig || !tierConfig.notificationChannels) {
      return [];
    }

    return (tierConfig.notificationChannels.allowedTypes ??
      []) as NotificationChannelType[];
  }

  firstTierWithNotificationChannel(
    channelType: NotificationChannelType,
  ): UserTier | null {
    if (!this.config) {
      return null;
    }

    const tierOrder = [UserTier.FREE, UserTier.EARLY_BIRD, UserTier.PRO];

    for (const tier of tierOrder) {
      const allowedChannels = this.allowedNotificationChannels(tier);
      if (allowedChannels.includes(channelType)) {
        return tier;
      }
    }

    return null;
  }

  logRetentionHours(tier: UserTier): number {
    if (!this.config) {
      return 0;
    }

    return this.config.projectPlanConfigs[tier].logs.retentionHours ?? 0;
  }

  formatTierName(tier: UserTier): string {
    // todo: make usertier a value object
    return match(tier)
      .with(UserTier.FREE, () => 'Free')
      .with(UserTier.EARLY_BIRD, () => 'Early Bird')
      .with(UserTier.CONTRIBUTOR, () => 'Contributor')
      .with(UserTier.PRO, () => 'Pro')
      .otherwise(() => tier);
  }
}

export const exposedConfigState = new ExposedConfigState();
