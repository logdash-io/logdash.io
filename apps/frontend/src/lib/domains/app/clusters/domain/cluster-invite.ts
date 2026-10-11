export enum ClusterRole {
  CREATOR = 'creator',
  ADMIN = 'admin',
  WRITE = 'write',
}

export const CLUSTER_ROLE_LABELS: Record<ClusterRole, string> = {
  [ClusterRole.CREATOR]: 'Owner',
  [ClusterRole.ADMIN]: 'Admin',
  [ClusterRole.WRITE]: 'Member',
};

export function canManageTeam(role: ClusterRole | undefined): boolean {
  return role === ClusterRole.CREATOR || role === ClusterRole.ADMIN;
}

export type ClusterInvite = {
  id: string;
  inviterUserId: string;
  invitedUserEmail: string;
  clusterId: string;
  clusterName: string;
  role: ClusterRole;
  createdAt: string;
  updatedAt: string;
};

export type ClusterMember = {
  id: string;
  email: string;
  avatarUrl: string;
  role: ClusterRole;
};

export type ClusterInviteCapacity = {
  maxMembers: number;
  currentUsersCount: number;
  currentInvitesCount: number;
  members: ClusterMember[];
};
