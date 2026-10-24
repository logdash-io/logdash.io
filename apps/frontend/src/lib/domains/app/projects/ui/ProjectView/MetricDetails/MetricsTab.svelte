<script lang="ts">
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import MetricDetails from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricDetails.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
  import SdkSetupPrompt from '$lib/domains/app/projects/ui/setup/SdkSetupPrompt.svelte';
  import { Feature } from '$lib/domains/shared/types.js';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';

  const clusterId = $derived(page.params.cluster_id);
  const metricId = $derived(page.params.metric_id);
  const empty = $derived(
    metricsState.ready && metricsState.simplifiedMetrics.length === 0,
  );

  $effect(() => {
    if (
      clusterId &&
      metricId &&
      metricsState.simplifiedMetrics.some(({ id }) => id === metricId)
    ) {
      metricsState.setLastPreviewedMetricId(clusterId, metricId);
    }
  });
</script>

{#if empty && clusterId}
  <div class="flex flex-1 flex-col p-2">
    <Well label="Metrics">
      <div
        class="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
      >
        <p class="font-medium">No metrics yet</p>
        <p class="text-fg-tertiary max-w-sm text-sm text-balance">
          Counters you send from your apps show up here.
        </p>
        <div class="mt-2">
          <SdkSetupPrompt {clusterId} feature={Feature.METRICS} />
        </div>
      </div>
    </Well>
  </div>
{:else}
  <div class="@container flex flex-1 flex-col">
    <div class="flex flex-1 flex-col gap-2 p-2 @4xl:flex-row">
      <MetricDetails />

      <div class="flex min-h-0 shrink-0 flex-col @4xl:w-72 @6xl:w-80">
        <MetricsTiles />
      </div>
    </div>
  </div>
{/if}
