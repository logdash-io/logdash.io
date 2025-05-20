import { UserTier } from '../../user/core/enum/user-tier.enum';

interface UserPlanConfig {
  projects: {
    maxNumberOfProjects: number;
  };
  httpMonitors: {
    maxNumberOfMonitors: number;
  };
}

export interface UserPlanConfigs {
  [UserTier.Free]: UserPlanConfig;
  [UserTier.EarlyBird]: UserPlanConfig;
  [UserTier.Admin]: UserPlanConfig;
}

export const UserPlanConfigs: UserPlanConfigs = {
  [UserTier.Free]: {
    projects: {
      maxNumberOfProjects: 5,
    },
    httpMonitors: {
      maxNumberOfMonitors: 2,
    },
  },
  [UserTier.EarlyBird]: {
    projects: {
      maxNumberOfProjects: 20,
    },
    httpMonitors: {
      maxNumberOfMonitors: 10,
    },
  },
  [UserTier.Admin]: {
    projects: {
      maxNumberOfProjects: 100,
    },
    httpMonitors: {
      maxNumberOfMonitors: 100,
    },
  },
};

export function getUserPlanConfig(tier: UserTier): UserPlanConfig {
  return UserPlanConfigs[tier];
}
