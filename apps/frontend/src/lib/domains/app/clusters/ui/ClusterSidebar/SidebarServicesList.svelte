<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import MonitorStatus from '$lib/domains/app/projects/ui/monitor-status/MonitorStatus.svelte';
  import HexagonIcon from '$lib/domains/shared/icons/HexagonIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  const isWizardMode = $derived(wizardState.isActive);

  const currentCluster = $derived(
    isWizardMode
      ? clustersState.get(wizardState.tempClusterId)
      : clustersState.get(page.params.cluster_id),
  );
  const activeProjectId = $derived(
    page.params.project_id || page.url.searchParams.get('project_id'),
  );
  const clusterId = $derived(
    isWizardMode ? wizardState.tempClusterId : page.params.cluster_id,
  );

  function onServiceSelect(projectId: string): void {
    if (isWizardMode) {
      wizardState.scrollToSection(`service-${projectId}`);
      return;
    }
    goto(`/app/clusters/${page.params.cluster_id}/${projectId}`);
  }

  function getServiceHealthStatus(projectId: string): boolean | null {
    if (isWizardMode) return null;
    const monitor = monitoringState.getMonitorByProjectId(projectId);
    if (!monitor) {
      return null;
    }
    return monitoringState.isHealthy(monitor.id);
  }

  function hasMonitor(projectId: string): boolean {
    if (isWizardMode) return false;
    return !!monitoringState.getMonitorByProjectId(projectId);
  }
</script>

<div class="flex flex-1 flex-col gap-1">
  <span class="p-2 text-sm font-medium tracking-wide text-base-content/50">
    Services
  </span>
  <nav class="flex flex-col gap-0.5">
    {#each currentCluster?.projects || [] as project}
      {@const isActive = !isWizardMode && project.id === activeProjectId}
      {@const healthStatus = getServiceHealthStatus(project.id)}
      {@const projectHasMonitor = hasMonitor(project.id)}
      <SidebarMenuItem
        onclick={() => onServiceSelect(project.id)}
        {isActive}
        disabled={!clusterId}
      >
        {#if projectHasMonitor}
          {#snippet monitorTooltipContent()}
            <MonitorStatus projectId={project.id}>
              {null}
            </MonitorStatus>
          {/snippet}
          <Tooltip content={monitorTooltipContent} placement="bottom">
            <HexagonIcon
              class="size-4 shrink-0 {healthStatus === true
                ? 'text-success'
                : 'text-error'}"
            />
          </Tooltip>
        {:else}
          <HexagonIcon class="size-4 shrink-0 text-base-content/30" />
        {/if}
        <span class="truncate">{project.name || 'New Service'}</span>
      </SidebarMenuItem>
    {/each}
    {#if isWizardMode && (currentCluster?.projects || []).length === 0}
      <span class="px-3 py-2 text-sm italic text-base-content/30">
        No services yet
      </span>
    {/if}
  </nav>
</div>
