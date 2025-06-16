import { ProjectTier } from '../../../project/core/enums/project-tier.enum';
import { UserTier } from '../../../user/core/enum/user-tier.enum';

export enum ClusterTier {
  Free = 'free',
  Contributor = 'contributor',
  EarlyBird = 'early-bird',
  Admin = 'admin',
}

export function clusterTierFromUserTier(userTier: string): ClusterTier {
  const map: Record<UserTier, ClusterTier> = {
    [UserTier.Free]: ClusterTier.Free,
    [UserTier.Contributor]: ClusterTier.Contributor,
    [UserTier.EarlyBird]: ClusterTier.EarlyBird,
    [UserTier.Admin]: ClusterTier.Admin,
  };

  return map[userTier];
}

export function clusterTierFromProjectTier(projectTier: ProjectTier): ClusterTier {
  const map: Record<ProjectTier, ClusterTier> = {
    [ProjectTier.Free]: ClusterTier.Free,
    [ProjectTier.Contributor]: ClusterTier.Contributor,
    [ProjectTier.EarlyBird]: ClusterTier.EarlyBird,
    [ProjectTier.Admin]: ClusterTier.Admin,
  };

  return map[projectTier];
}
