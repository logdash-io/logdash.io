import { UserTier } from '../../user/core/enum/user-tier.enum';

interface UserPlanConfig {
  projects: {
    maxNumberOfProjects: number;
  };
  publicDashboards: {
    maxNumberOfPublicDashboards: number;
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
  },
  [UserTier.Contributor]: {
    projects: {
      maxNumberOfProjects: 10,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 5,
    },
  },
  [UserTier.EarlyBird]: {
    projects: {
      maxNumberOfProjects: 20,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 5,
    },
  },
  [UserTier.Admin]: {
    projects: {
      maxNumberOfProjects: 100,
    },
    publicDashboards: {
      maxNumberOfPublicDashboards: 100,
    },
  },
};

export function getUserPlanConfig(tier: UserTier): UserPlanConfig {
  return UserPlanConfigs[tier];
}
