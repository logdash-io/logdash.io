<script lang="ts">
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import MetricDetails from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricDetails.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
  import SdkSetupPrompt from '$lib/domains/app/projects/ui/setup/SdkSetupPrompt.svelte';
  import { Feature } from '$lib/domains/shared/types.js';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import PaneHeader from '$lib/domains/shared/ui/components/PaneHeader.svelte';

  const projectId = $derived(page.params.project_id);
  const metricId = $derived(page.params.metric_id);
  const empty = $derived(
    metricsState.ready && metricsState.simplifiedMetrics.length === 0,
  );

  $effect(() => {
    if (
      projectId &&
      metricId &&
      metricsState.simplifiedMetrics.some(({ id }) => id === metricId)
    ) {
      metricsState.setLastPreviewedMetricId(projectId, metricId);
    }
  });
</script>

{#if empty && projectId}
  <div class="flex flex-1 flex-col">
    <PaneHeader title="Metrics">
      <span class="tabular-nums">0 tracked</span>
    </PaneHeader>

    <EmptyState
      class="p-4"
      title="No metrics yet"
      description="Counters you send from your app show up here."
    >
      <SdkSetupPrompt {projectId} feature={Feature.METRICS} />
    </EmptyState>
  </div>
{:else}
  <div class="flex flex-1 flex-col lg:flex-row">
    <div class="flex min-w-0 flex-1 flex-col">
      <MetricDetails />
    </div>

    <div
      class="border-hairline flex shrink-0 flex-col max-lg:border-t lg:w-64 lg:border-l xl:w-72"
    >
      <MetricsTiles />
    </div>
  </div>
{/if}
