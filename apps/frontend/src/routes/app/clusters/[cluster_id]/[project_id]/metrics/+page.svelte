<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
  import MetricDetails from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricDetails.svelte';
  import MetricsSetupOverlay from '$lib/domains/app/projects/ui/setup/MetricsSetupOverlay.svelte';

  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);

  $effect(() => {
    if (!metricsState.ready || metricsState.isUsingFakeData) {
      return;
    }

    const lastPreviewedId = metricsState.getLastPreviewedMetricId(projectId);
    const metricToPreview =
      lastPreviewedId && metricsState.getById(lastPreviewedId)
        ? lastPreviewedId
        : metricsState.simplifiedMetrics[0]?.id;

    if (!metricToPreview) {
      return;
    }

    goto(`/app/clusters/${clusterId}/${projectId}/metrics/${metricToPreview}`, {
      replaceState: true,
    });
  });
</script>

<ProjectSync>
  <div class="relative flex w-full max-w-full flex-col gap-1.5 md:flex-row">
    {#if metricsState.isUsingFakeData}
      <div class="sticky top-4 flex flex-1 flex-col gap-1.5 self-start">
        <MetricDetails />
      </div>
    {/if}

    <div class="w-full shrink-0 sm:w-80">
      <MetricsTiles />
    </div>

    {#if metricsState.isUsingFakeData && projectsState.ready && metricsState.ready}
      <MetricsSetupOverlay {projectId} />
    {/if}
  </div>
</ProjectSync>
