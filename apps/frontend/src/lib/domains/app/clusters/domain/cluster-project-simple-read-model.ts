import type { Feature } from '$lib/domains/shared/types';

export type ClusterProjectReadModel = {
  id: string;
  name: string;
  features: Feature[];
};
