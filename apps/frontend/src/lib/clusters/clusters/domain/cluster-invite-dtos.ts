import type { ClusterRole } from './cluster-invite';

export type CreateClusterInviteDto = {
  email: string;
  role: ClusterRole;
};

export type AcceptClusterInviteDto = Record<string, never>;
