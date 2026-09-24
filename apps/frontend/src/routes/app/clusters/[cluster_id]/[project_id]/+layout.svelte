<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { untrack } from 'svelte';
  import type { LayoutProps } from './$types';

  const { children, data, params }: LayoutProps = $props();

  const clusterId = $derived(params.cluster_id);
  const projectId = $derived(params.project_id);

  const originalClusterName = $derived(
    clustersState.clusters.find((c) => c.id === clusterId)?.name,
  );
  const clusterName = $derived(clustersState.clusterName(clusterId));
  const projectName = $derived(
    clustersState.clusters
      .find((c) => c.id === clusterId)
      ?.projects?.find((p) => p.id === projectId)?.name,
  );

  $effect(() => {
    logsState.set(data.initialLogs);
    metricsState.set(data.initialMetrics);
    monitoringState.set(data.initialMonitors);
  });

  $effect(() => {
    void untrack(() => monitoringState.sync(clusterId));

    return () => {
      monitoringState.unsync();
    };
  });
</script>

<svelte:head>
  <title>
    {projectName ? `${projectName} - ` : ''}{clusterName || originalClusterName}
    | logdash
  </title>
</svelte:head>

{@render children?.()}
