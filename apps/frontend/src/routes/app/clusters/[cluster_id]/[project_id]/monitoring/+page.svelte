<script lang="ts">
  import { page } from '$app/state';
  import { Feature } from '$lib/domains/shared/types.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import MonitoringTile from '$lib/domains/app/projects/ui/ProjectView/tiles/MonitoringTile.svelte';
  import NotificationChannelSetupModal from '$lib/domains/app/projects/ui/notification-channels/NotificationChannelSetupModal.svelte';
  import MonitoringSetupInline from '$lib/domains/app/projects/ui/setup/MonitoringSetupInline.svelte';

  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);

  const hasMonitoring = $derived(
    projectsState.hasConfiguredFeature(projectId, Feature.MONITORING) &&
      monitoringState.monitors.length > 0,
  );
</script>

<ProjectSync>
  <NotificationChannelSetupModal {clusterId} />

  {#if hasMonitoring && projectsState.ready}
    <div class="flex w-full flex-1 flex-col gap-4 overflow-hidden max-w-3xl">
      <MonitoringTile {projectId} expanded={true} />
    </div>
  {:else if projectsState.ready}
    <MonitoringSetupInline {projectId} />
  {/if}
</ProjectSync>
