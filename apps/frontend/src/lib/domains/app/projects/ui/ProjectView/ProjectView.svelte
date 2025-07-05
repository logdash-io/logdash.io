<script lang="ts">
  import { page } from '$app/state';
  import { Feature } from '$lib/domains/shared/types.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import NotificationChannelSetupModal from '$lib/domains/app/projects/ui/notification-channels/NotificationChannelSetupModal.svelte';
  import EmptyState from '$lib/domains/app/projects/ui/ProjectView/EmptyState.svelte';
  import MetricDetails from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricDetails.svelte';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import LogsLineChartTile from '$lib/domains/logs/ui/LogMetricsTile.svelte';
  import LogsListTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';

  const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));
  const clusterId = $derived(page.params.cluster_id);

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
  <NotificationChannelSetupModal {clusterId} />

  {#if hasLogging && (!previewedMetricId || isMobile) && metricsState.ready}
    <div class="flex flex-1 flex-col gap-4">
      <DataTile
        delayIn={0}
        delayOut={50}
        class="overflow-hidden rounded-xl p-0 pt-4"
      >
        <LogsListTile />
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
