<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import type { LayoutProps } from './$types';

  const { children, data, params }: LayoutProps = $props();

  $effect(() => {
    logsState.set(data.initialLogs);
    metricsState.set(params.project_id, data.initialMetrics);
  });
</script>

{@render children?.()}
