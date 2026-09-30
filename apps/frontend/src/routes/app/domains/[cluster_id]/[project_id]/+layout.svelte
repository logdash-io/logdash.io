<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { untrack } from 'svelte';
  import type { LayoutProps } from './$types';

  const { children, data, params }: LayoutProps = $props();

  const clusterId = $derived(params.cluster_id);

  $effect(() => {
    logsState.set(data.initialLogs);
    metricsState.set(params.project_id, data.initialMetrics);
  });

  $effect(() => {
    const syncedClusterId = clusterId;
    void untrack(() => monitoringState.sync(syncedClusterId));

    return () => {
      monitoringState.unsync();
    };
  });
</script>

{@render children?.()}
