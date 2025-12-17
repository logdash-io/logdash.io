<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import MonitorStatus from '$lib/domains/app/projects/ui/monitor-status/MonitorStatus.svelte';
  import HexagonIcon from '$lib/domains/shared/icons/HexagonIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';

  const currentCluster = $derived(clustersState.get(page.params.cluster_id));
  const activeProjectId = $derived(
    page.params.project_id || page.url.searchParams.get('project_id'),
  );

  function onServiceSelect(projectId: string): void {
    goto(`/app/clusters/${page.params.cluster_id}/${projectId}`);
  }

  function getServiceHealthStatus(projectId: string): boolean | null {
    const monitor = monitoringState.getMonitorByProjectId(projectId);
    if (!monitor) {
      return null;
    }
    return monitoringState.isHealthy(monitor.id);
  }

  function hasMonitor(projectId: string): boolean {
    return !!monitoringState.getMonitorByProjectId(projectId);
  }
</script>

<div class="flex flex-1 flex-col gap-1">
  <span class="p-2 text-sm font-medium tracking-wide text-base-content/50">
    Services
  </span>
  <nav class="flex flex-col gap-0.5">
    {#each currentCluster?.projects || [] as project}
      {@const isActive = project.id === activeProjectId}
      {@const healthStatus = getServiceHealthStatus(project.id)}
      {@const projectHasMonitor = hasMonitor(project.id)}
      <button
        onclick={() => onServiceSelect(project.id)}
        class={[
          'flex text-sm w-full items-center gap-2 rounded-lg p-2 cursor-pointer',
          {
            'bg-base-100 text-base-content': isActive,
            'hover:bg-base-100/80': !isActive,
          },
        ]}
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
        <span class="truncate">{project.name}</span>
      </button>
    {/each}
  </nav>
</div>
