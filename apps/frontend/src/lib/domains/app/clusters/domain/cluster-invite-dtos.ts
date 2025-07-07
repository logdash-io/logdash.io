import type { ClusterRole } from '$lib/domains/app/clusters/domain/cluster-invite';

export type CreateClusterInviteDto = {
  email: string;
  role: ClusterRole;
};

export type AcceptClusterInviteDto = Record<string, never>;
