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
  import LogsListTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
  import MonitoringTile from './tiles/MonitoringTile.svelte';
  import { monitoringState } from '../../application/monitoring.state.svelte.js';

  const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));
  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.url.searchParams.get('project_id'));

  const hasLogging = $derived(
    projectsState.hasFeature(projectId, Feature.LOGGING),
  );

  const hasMetrics = $derived(
    projectsState.hasFeature(projectId, Feature.METRICS) &&
      metricsState.simplifiedMetrics.length > 0,
  );

  const hasMonitoring = $derived(
    projectsState.hasFeature(projectId, Feature.MONITORING) &&
      monitoringState.monitors.length > 0,
  );

  const isMobile = $derived.by(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < 640;
  });
</script>

<ProjectSync>
  <NotificationChannelSetupModal {clusterId} />

  {#if (hasLogging || hasMonitoring) && (!previewedMetricId || isMobile) && metricsState.ready}
    <div class="flex w-full flex-1 flex-col gap-4 overflow-hidden">
      {#if hasMonitoring}
        <MonitoringTile {projectId} />
      {/if}

      {#if hasLogging}
        <DataTile
          delayIn={0}
          delayOut={50}
          class="overflow-hidden rounded-xl p-0 pt-4"
        >
          <LogsListTile />
        </DataTile>
      {/if}
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
