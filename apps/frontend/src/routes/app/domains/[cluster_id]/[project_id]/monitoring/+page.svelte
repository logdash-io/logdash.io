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

  const hasMonitor = $derived(
    Boolean(monitoringState.getMonitorByProjectId(projectId)),
  );
</script>

<ProjectSync>
  <NotificationChannelSetupModal {clusterId} />

  {#if hasMonitor}
    <MonitoringTile {clusterId} {projectId} expanded={true} />
  {:else if projectsState.ready}
    {#key projectId}
      <MonitoringSetupInline {clusterId} {projectId} />
    {/key}
  {/if}
</ProjectSync>
