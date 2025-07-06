import { UserTier } from '../../../user/core/enum/user-tier.enum';

export enum ProjectTier {
  // free
  Free = 'free',
  EarlyUser = 'early-user',

  // paid
  EarlyBird = 'early-bird',
  Builder = 'builder',
  Pro = 'pro',

  // special
  Contributor = 'contributor',
  Admin = 'admin',
}

export function projectTierFromUserTier(userTier: UserTier): ProjectTier {
  const map: Record<UserTier, ProjectTier> = {
    [UserTier.Free]: ProjectTier.Free,
    [UserTier.EarlyUser]: ProjectTier.EarlyUser,

    [UserTier.EarlyBird]: ProjectTier.EarlyBird,
    [UserTier.Builder]: ProjectTier.Builder,
    [UserTier.Pro]: ProjectTier.Pro,

    [UserTier.Contributor]: ProjectTier.Contributor,
    [UserTier.Admin]: ProjectTier.Admin,
  };

  return map[userTier];
}
