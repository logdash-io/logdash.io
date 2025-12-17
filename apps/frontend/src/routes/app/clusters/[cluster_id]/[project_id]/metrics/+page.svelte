<script lang="ts">
  import { page } from '$app/state';
  import { Feature } from '$lib/domains/shared/types.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
  import MetricDetails from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricDetails.svelte';
  import EmptyState from '$lib/domains/app/projects/ui/ProjectView/EmptyState.svelte';

  const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));
  const projectId = $derived(page.params.project_id);

  const hasMetrics = $derived(
    projectsState.hasFeature(projectId, Feature.METRICS) &&
      metricsState.simplifiedMetrics.length > 0,
  );
</script>

<ProjectSync>
  {#if hasMetrics && metricsState.ready}
    <div class="flex w-full max-w-full flex-col gap-4 md:flex-row">
      {#if previewedMetricId}
        <div class="flex flex-1 flex-col gap-4">
          <MetricDetails />
        </div>
      {/if}

      <div class="w-full shrink-0 sm:w-96">
        <MetricsTiles />
      </div>
    </div>
  {:else if projectsState.ready && metricsState.ready}
    <EmptyState />
  {/if}
</ProjectSync>
