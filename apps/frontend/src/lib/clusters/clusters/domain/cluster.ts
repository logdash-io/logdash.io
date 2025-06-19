import type { ClusterProjectReadModel } from './cluster-project-simple-read-model';

export type Cluster = {
  id: string;
  name: string;
  members: string[];
  creatorId: string;
  tier: string;
  projects: ClusterProjectReadModel[];
  publicDashboards: {
    id: string;
    name: string;
    isPublic: boolean;
  }[];
};
