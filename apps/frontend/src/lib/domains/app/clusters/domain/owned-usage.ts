import type { Cluster } from './cluster';

export type OwnedUsage = {
  domains: number;
  services: number;
  statusPages: number;
};

export function ownedUsage(
  clusters: Cluster[],
  userId: string | undefined,
): OwnedUsage {
  const owned = clusters.filter((cluster) => cluster.creatorId === userId);

  return {
    domains: owned.length,
    services: owned.reduce(
      (count, cluster) => count + (cluster.projects?.length ?? 0),
      0,
    ),
    statusPages: owned.reduce(
      (count, cluster) => count + (cluster.publicDashboards?.length ?? 0),
      0,
    ),
  };
}
