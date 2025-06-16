<script lang="ts">
  import { page } from '$app/state';
  import { Feature } from '$lib/shared/types.js';
  import { metricsState } from '../../application/metrics.state.svelte.js';
  import { projectsState } from '../../application/projects.state.svelte.js';
  import EmptyState from './EmptyState.svelte';
  import MetricDetails from './MetricDetails/MetricDetails.svelte';
  import ProjectSync from './ProjectSync.svelte';
  import DataTile from './tiles/DataTile.svelte';
  import LogsLineChartTile from './tiles/LogMetricsTile.svelte';
  import LogsListTile from './tiles/LogsTile.svelte';
  import MetricsTiles from './tiles/MetricsTiles.svelte';

  const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));

  const hasLogging = $derived.by(() => {
    const id = page.url.searchParams.get('project_id');

    return projectsState.hasFeature(id, Feature.LOGGING);
  });

  const hasMetrics = $derived.by(() => {
    const id = page.url.searchParams.get('project_id');

    return (
      projectsState.hasFeature(id, Feature.METRICS) &&
      metricsState.simplifiedMetrics.length > 0
    );
  });

  const hasMonitoring = $derived.by(() => {
    const id = page.url.searchParams.get('project_id');

    return projectsState.hasFeature(id, Feature.MONITORING);
  });

  const isMobile = $derived.by(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < 640;
  });
</script>

<ProjectSync>
  {#if hasLogging && (!previewedMetricId || isMobile) && metricsState.ready}
    <div class="flex flex-1 flex-col gap-4">
      <DataTile delayIn={0} delayOut={50}>
        <LogsListTile />
      </DataTile>

      <DataTile delayIn={100}>
        <LogsLineChartTile />
      </DataTile>
    </div>
  {/if}

  {#if previewedMetricId && projectsState.ready && hasLogging && metricsState.ready}
    <div class="flex flex-1 flex-col gap-4">
      <MetricDetails />
    </div>
  {/if}

  {#if hasMetrics && metricsState.ready}
    <div class="w-full shrink-0 sm:w-96">
      <MetricsTiles />
    </div>
  {/if}

  {#if previewedMetricId && projectsState.ready && !hasLogging}
    <div class="flex flex-1 flex-col gap-4">
      <MetricDetails />
    </div>
  {/if}

  {#if !hasMetrics && !hasLogging && !hasMonitoring && projectsState.ready && metricsState.ready}
    <EmptyState />
  {/if}
</ProjectSync>
