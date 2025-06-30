export enum ClusterRole {
  CREATOR = 'creator',
  WRITE = 'write',
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
