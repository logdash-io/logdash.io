import type { Cluster } from '$lib/domains/app/clusters/domain/cluster.js';
import type { ServiceEntry } from '$lib/domains/app/clusters/domain/service-groups.js';
import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';

export function serviceEntries(cluster: Cluster | undefined): ServiceEntry[] {
  return (cluster?.projects ?? []).map(({ id, name }) => ({
    id,
    name,
    url: monitoringState.getMonitorByProjectId(id)?.url,
  }));
}
