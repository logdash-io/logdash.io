import { NotificationChannelType } from '../../notification-channel/core/enums/notification-target.enum';
import { UserTier } from '../../user/core/enum/user-tier.enum';

interface UserPlanConfig {
  projects: {
    maxNumberOfProjects: number;
  };
  publicDashboards: {
    maxNumberOfPublicDashboards: number;
  };
  httpMonitors: {
    maxNumberOfMonitors: number;
  };
  notificationChannels: {
    allowedTypes: NotificationChannelType[];
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
    httpMonitors: {
      maxNumberOfMonitors: 5,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 1,
    },
    notificationChannels: {
      allowedTypes: [
        NotificationChannelType.Telegram,
        NotificationChannelType.Webhook,
        NotificationChannelType.Email,
      ],
    },
  },
  [UserTier.EarlyUser]: {
    projects: {
      maxNumberOfProjects: 5,
    },
    httpMonitors: {
      maxNumberOfMonitors: 5,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 1,
    },
    notificationChannels: {
      allowedTypes: [
        NotificationChannelType.Telegram,
        NotificationChannelType.Webhook,
        NotificationChannelType.Email,
      ],
    },
  },

  // paid
  [UserTier.EarlyBird]: {
    projects: {
      maxNumberOfProjects: 20,
    },
    httpMonitors: {
      maxNumberOfMonitors: 20,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 5,
    },
    notificationChannels: {
      allowedTypes: [
        NotificationChannelType.Telegram,
        NotificationChannelType.Webhook,
        NotificationChannelType.Email,
      ],
    },
  },
  [UserTier.Builder]: {
    projects: {
      maxNumberOfProjects: 20,
    },
    httpMonitors: {
      maxNumberOfMonitors: 20,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 5,
    },
    notificationChannels: {
      allowedTypes: [
        NotificationChannelType.Telegram,
        NotificationChannelType.Webhook,
        NotificationChannelType.Email,
      ],
    },
  },
  [UserTier.Pro]: {
    projects: {
      maxNumberOfProjects: 50,
    },
    httpMonitors: {
      maxNumberOfMonitors: 50,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 15,
    },
    notificationChannels: {
      allowedTypes: [
        NotificationChannelType.Telegram,
        NotificationChannelType.Webhook,
        NotificationChannelType.Email,
      ],
    },
  },

  // special
  [UserTier.Contributor]: {
    projects: {
      maxNumberOfProjects: 10,
    },
    httpMonitors: {
      maxNumberOfMonitors: 10,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 5,
    },
    notificationChannels: {
      allowedTypes: [
        NotificationChannelType.Telegram,
        NotificationChannelType.Webhook,
        NotificationChannelType.Email,
      ],
    },
  },
  [UserTier.Admin]: {
    projects: {
      maxNumberOfProjects: 100,
    },
    httpMonitors: {
      maxNumberOfMonitors: 100,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 100,
    },
    notificationChannels: {
      allowedTypes: [
        NotificationChannelType.Telegram,
        NotificationChannelType.Webhook,
        NotificationChannelType.Email,
      ],
    },
  },
};

export function getUserPlanConfig(tier: UserTier): UserPlanConfig {
  return UserPlanConfigs[tier];
}
