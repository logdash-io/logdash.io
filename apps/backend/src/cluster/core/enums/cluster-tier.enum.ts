import { ProjectTier } from '../../../project/core/enums/project-tier.enum';
import { UserTier } from '../../../user/core/enum/user-tier.enum';

export enum ClusterTier {
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

export function clusterTierFromUserTier(userTier: string): ClusterTier {
  const map: Record<UserTier, ClusterTier> = {
    [UserTier.Free]: ClusterTier.Free,
    [UserTier.EarlyUser]: ClusterTier.EarlyUser,

    [UserTier.EarlyBird]: ClusterTier.EarlyBird,
    [UserTier.Builder]: ClusterTier.Builder,
    [UserTier.Pro]: ClusterTier.Pro,

    [UserTier.Contributor]: ClusterTier.Contributor,
    [UserTier.Admin]: ClusterTier.Admin,
  };

  return map[userTier];
}

export function clusterTierFromProjectTier(projectTier: ProjectTier): ClusterTier {
  const map: Record<ProjectTier, ClusterTier> = {
    [ProjectTier.Free]: ClusterTier.Free,
    [ProjectTier.EarlyUser]: ClusterTier.EarlyUser,

    [ProjectTier.EarlyBird]: ClusterTier.EarlyBird,
    [ProjectTier.Builder]: ClusterTier.Builder,
    [ProjectTier.Pro]: ClusterTier.Pro,

    [ProjectTier.Contributor]: ClusterTier.Contributor,
    [ProjectTier.Admin]: ClusterTier.Admin,
  };

  return map[projectTier];
}
