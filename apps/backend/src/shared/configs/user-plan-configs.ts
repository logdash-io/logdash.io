import { UserTier } from '../../user/core/enum/user-tier.enum';
import { NotificationChannelType } from '../../notification-channel/core/enums/notification-target.enum';

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
}

export interface UserPlanConfigs {
  [UserTier.Free]: UserPlanConfig;
  [UserTier.Contributor]: UserPlanConfig;
  [UserTier.EarlyBird]: UserPlanConfig;
  [UserTier.Admin]: UserPlanConfig;
}

export const UserPlanConfigs: UserPlanConfigs = {
  [UserTier.Free]: {
    projects: {
      maxNumberOfProjects: 5,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 1,
    },
    notificationChannels: {
      allowedTypes: [NotificationChannelType.Telegram],
    },
  },
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
  },
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
  },
};

export function getUserPlanConfig(tier: UserTier): UserPlanConfig {
  return UserPlanConfigs[tier];
}
