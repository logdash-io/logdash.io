import { UserTier } from '../../../user/core/enum/user-tier.enum';

export enum ProjectTier {
  Free = 'free',
  Contributor = 'contributor',
  EarlyBird = 'early-bird',
  Admin = 'admin',
}

export function projectTierFromUserTier(userTier: UserTier): ProjectTier {
  const map: Record<UserTier, ProjectTier> = {
    [UserTier.Free]: ProjectTier.Free,
    [UserTier.Contributor]: ProjectTier.Contributor,
    [UserTier.EarlyBird]: ProjectTier.EarlyBird,
    [UserTier.Admin]: ProjectTier.Admin,
  };

  return map[userTier];
}
