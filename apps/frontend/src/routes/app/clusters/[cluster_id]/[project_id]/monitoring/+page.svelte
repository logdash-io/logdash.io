<script lang="ts">
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import MonitoringTile from '$lib/domains/app/projects/ui/ProjectView/tiles/MonitoringTile.svelte';
  import NotificationChannelSetupModal from '$lib/domains/app/projects/ui/notification-channels/NotificationChannelSetupModal.svelte';
  import MonitoringSetupInline from '$lib/domains/app/projects/ui/setup/MonitoringSetupInline.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();

  const clusterId = $derived(params.cluster_id);
  const projectId = $derived(params.project_id);

  const hasClaimedMonitor = $derived(
    Boolean(monitoringState.getMonitorByProjectId(projectId)),
  );
</script>

<ProjectSync>
  <NotificationChannelSetupModal {clusterId} />

  {#if hasClaimedMonitor && projectsState.ready}
    <div class="flex w-full flex-1 flex-col gap-4 overflow-hidden max-w-3xl">
      <MonitoringTile {clusterId} {projectId} expanded={true} />
    </div>
  {:else if projectsState.ready}
    <MonitoringSetupInline {clusterId} {projectId} />
  {/if}
</ProjectSync>
