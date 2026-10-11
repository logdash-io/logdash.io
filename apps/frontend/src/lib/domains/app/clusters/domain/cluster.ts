import type { ClusterRole } from '$lib/domains/app/clusters/domain/cluster-invite';
import type { ClusterProjectReadModel } from '$lib/domains/app/clusters/domain/cluster-project-simple-read-model';

export type Cluster = {
  id: string;
  name: string;
  members: string[];
  creatorId: string;
  roles: Record<string, ClusterRole>;
  tier: string;
  projects: ClusterProjectReadModel[];
  publicDashboards: {
    id: string;
    name: string;
    isPublic: boolean;
  }[];
  color?: string;
};

export type ClusterPulse = {
  clusterId: string;
  online: number;
  downMonitorIds: string[];
};
