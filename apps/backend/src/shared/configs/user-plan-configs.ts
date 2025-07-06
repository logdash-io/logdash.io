import { CronExpression } from '@nestjs/schedule';
import { NotificationChannelType } from '../../notification-channel/core/enums/notification-target.enum';
import { UserTier } from '../../user/core/enum/user-tier.enum';

interface UserPlanConfig {
  projects: {
    maxNumberOfProjects: number;
  };
  publicDashboards: {
    maxNumberOfPublicDashboards: number;
  };
  notificationChannels: {
    allowedTypes: NotificationChannelType[];
  };
  pings: {
    frequency: CronExpression;
  };
}

export interface UserPlanConfigs {
  // free
  [UserTier.Free]: UserPlanConfig;
  [UserTier.EarlyUser]: UserPlanConfig;

  // paid
  [UserTier.EarlyBird]: UserPlanConfig;
  [UserTier.Builder]: UserPlanConfig;
  [UserTier.Pro]: UserPlanConfig;

  // special
  [UserTier.Admin]: UserPlanConfig;
  [UserTier.Contributor]: UserPlanConfig;
}

export const UserPlanConfigs: UserPlanConfigs = {
  // free
  [UserTier.Free]: {
    projects: {
      maxNumberOfProjects: 5,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 1,
    },
    notificationChannels: {
      allowedTypes: [NotificationChannelType.Telegram, NotificationChannelType.Webhook],
    },
    pings: {
      frequency: CronExpression.EVERY_5_MINUTES,
    },
  },
  [UserTier.EarlyUser]: {
    projects: {
      maxNumberOfProjects: 5,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 1,
    },
    notificationChannels: {
      allowedTypes: [NotificationChannelType.Telegram, NotificationChannelType.Webhook],
    },
    pings: {
      frequency: CronExpression.EVERY_5_MINUTES,
    },
  },

  // paid
  [UserTier.EarlyBird]: {
    projects: {
      maxNumberOfProjects: 20,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 5,
    },
    notificationChannels: {
      allowedTypes: [NotificationChannelType.Telegram, NotificationChannelType.Webhook],
    },
    pings: {
      frequency: CronExpression.EVERY_MINUTE,
    },
  },
  [UserTier.Builder]: {
    projects: {
      maxNumberOfProjects: 20,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 5,
    },
    notificationChannels: {
      allowedTypes: [NotificationChannelType.Telegram, NotificationChannelType.Webhook],
    },
    pings: {
      frequency: CronExpression.EVERY_MINUTE,
    },
  },
  [UserTier.Pro]: {
    projects: {
      maxNumberOfProjects: 50,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 15,
    },
    notificationChannels: {
      allowedTypes: [NotificationChannelType.Telegram, NotificationChannelType.Webhook],
    },
    pings: {
      frequency: CronExpression.EVERY_MINUTE,
    },
  },

  // special
  [UserTier.Contributor]: {
    projects: {
      maxNumberOfProjects: 10,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 5,
    },
    notificationChannels: {
      allowedTypes: [NotificationChannelType.Telegram, NotificationChannelType.Webhook],
    },
    pings: {
      frequency: CronExpression.EVERY_5_MINUTES,
    },
  },
  [UserTier.Admin]: {
    projects: {
      maxNumberOfProjects: 100,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 100,
    },
    notificationChannels: {
      allowedTypes: [NotificationChannelType.Telegram, NotificationChannelType.Webhook],
    },
    pings: {
      frequency: CronExpression.EVERY_MINUTE,
    },
  },
};

export function getUserPlanConfig(tier: UserTier): UserPlanConfig {
  return UserPlanConfigs[tier];
}
