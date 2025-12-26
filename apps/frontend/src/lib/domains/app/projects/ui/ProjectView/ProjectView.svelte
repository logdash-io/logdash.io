<script lang="ts">
  import { page } from '$app/state';
  import { Feature } from '$lib/domains/shared/types.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import NotificationChannelSetupModal from '$lib/domains/app/projects/ui/notification-channels/NotificationChannelSetupModal.svelte';
  import MetricDetails from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricDetails.svelte';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import LogsTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
  import MonitoringTile from './tiles/MonitoringTile.svelte';
  import UnconfiguredFeatureTile from './UnconfiguredFeatureTile.svelte';
  import UnifiedSetupOverlay from '$lib/domains/app/projects/ui/setup/UnifiedSetupOverlay.svelte';
  import { monitoringState } from '../../application/monitoring.state.svelte.js';

  type Props = {
    priorityProjectId?: string;
    priorityClusterId?: string;
  };

  const { priorityProjectId, priorityClusterId }: Props = $props();

  const previewedMetricId = $derived(page.params.metric_id);
  const clusterId = $derived(priorityClusterId ?? page.params.cluster_id);
  const projectId = $derived(priorityProjectId ?? page.params.project_id);
  const basePath = $derived(`/app/clusters/${clusterId}/${projectId}`);

  const selectedLogging = $derived(
    projectsState.hasFeature(projectId, Feature.LOGGING),
  );
  const selectedMetrics = $derived(
    projectsState.hasFeature(projectId, Feature.METRICS),
  );
  const selectedMonitoring = $derived(
    projectsState.hasFeature(projectId, Feature.MONITORING),
  );

  const hasLogging = $derived(
    projectsState.hasConfiguredFeature(projectId, Feature.LOGGING) ||
      logsState.logs.length > 0,
  );
  const hasMetrics = $derived(
    projectsState.hasConfiguredFeature(projectId, Feature.METRICS) ||
      metricsState.simplifiedMetrics.length > 0,
  );
  const hasMonitoring = $derived(
    Boolean(monitoringState.getMonitorByProjectId(projectId)),
  );

  const isMobile = $derived.by(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < 640;
  });
</script>

<ProjectSync {priorityProjectId} {priorityClusterId}>
  <NotificationChannelSetupModal {clusterId} />

  {#if (selectedLogging || selectedMonitoring) && (!previewedMetricId || isMobile) && metricsState.ready}
    <div class="flex w-full flex-1 flex-col gap-1.5 overflow-hidden">
      {#if selectedMonitoring}
        {#if hasMonitoring}
          <MonitoringTile {projectId} />
        {:else}
          <UnconfiguredFeatureTile
            feature={Feature.MONITORING}
            {basePath}
            delayIn={0}
          />
        {/if}
      {/if}

      {#if selectedLogging && projectsState.ready}
        <DataTile
          delayIn={0}
          delayOut={50}
          class={[
            'relative overflow-hidden ld-card-rounding p-0',
            {
              'pt-3': hasLogging,
            },
          ]}
        >
          <LogsTile {priorityProjectId} />
          {#if !hasLogging}
            <UnifiedSetupOverlay {projectId} />
          {/if}
        </DataTile>
      {/if}
    </div>
  {/if}

  {#if previewedMetricId && projectsState.ready && hasLogging && metricsState.ready}
    <div class="flex flex-1 flex-col gap-3">
      <MetricDetails />
    </div>
  {/if}

  {#if selectedMetrics && metricsState.ready}
    <div class="relative w-full shrink-0 sm:w-80 h-fit">
      <MetricsTiles />
      {#if metricsState.isUsingFakeData && projectsState.ready}
        <UnifiedSetupOverlay {projectId} />
      {/if}
    </div>
  {/if}

  {#if previewedMetricId && projectsState.ready && !hasLogging}
    <div class="flex flex-1 flex-col gap-3">
      <MetricDetails />
    </div>
  {/if}
</ProjectSync>
