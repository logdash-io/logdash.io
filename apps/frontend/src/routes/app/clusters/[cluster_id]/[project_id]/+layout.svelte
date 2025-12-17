<script lang="ts">
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import ServiceTabsNav from '$lib/domains/app/clusters/ui/ServiceTabsNav.svelte';
  import type { Log } from '$lib/domains/logs/domain/log.js';
  import type { Metric } from '$lib/domains/app/projects/domain/metric.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';

  type Props = {
    children: Snippet;
    data: {
      initialLogs: Log[];
      initialMetrics: Metric[];
      initialMonitors: Monitor[];
    };
  };

  const { children, data }: Props = $props();

  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);

  const originalClusterName = $derived(
    clustersState.clusters.find((c) => c.id === clusterId)?.name,
  );
  const clusterName = $derived(clustersState.clusterName(clusterId));
  const projectName = $derived(
    clustersState.clusters
      .find((c) => c.id === clusterId)
      ?.projects.find((p) => p.id === projectId)?.name,
  );

  $effect(() => {
    logsState.set(data.initialLogs);
    metricsState.set(data.initialMetrics);
    monitoringState.set(data.initialMonitors);
  });

  $effect(() => {
    const isSettingUp =
      page.url.pathname.includes('/setup') ||
      page.url.pathname.includes('/configure');

    if (isSettingUp) {
      return;
    }

    untrack(() => monitoringState.sync(clusterId));

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

<div class="flex w-full flex-col">
  <ServiceTabsNav {clusterId} {projectId} />

  <div class="flex-1 p-4">
    {@render children?.()}
  </div>
</div>
