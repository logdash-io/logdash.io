import { UserTier } from '../../user/core/enum/user-tier.enum';

interface UserPlanConfig {
  projects: {
    maxNumberOfProjects: number;
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
  },
  [UserTier.Contributor]: {
    projects: {
      maxNumberOfProjects: 10,
    },
  },
  [UserTier.EarlyBird]: {
    projects: {
      maxNumberOfProjects: 20,
    },
  },
  [UserTier.Admin]: {
    projects: {
      maxNumberOfProjects: 100,
    },
  },
};

export function getUserPlanConfig(tier: UserTier): UserPlanConfig {
  return UserPlanConfigs[tier];
}
