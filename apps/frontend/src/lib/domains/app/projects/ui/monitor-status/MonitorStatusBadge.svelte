<script lang="ts">
  import { page } from '$app/state';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import MonitorStatus from '$lib/domains/app/projects/ui/monitor-status/MonitorStatus.svelte';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';

  const { projectId } = $props();
  const projectMonitor = $derived(
    monitoringState.getMonitorByProjectId(projectId),
  );
  const isHealthy = $derived(monitoringState.isHealthy(projectMonitor?.id));
</script>

{#snippet fullStatus()}
  <MonitorStatus {projectId}>
    {null}
  </MonitorStatus>
{/snippet}

{#if projectMonitor}
  <Tooltip
    interactive={true}
    content={fullStatus}
    placement="bottom"
    align="left"
  >
    <div
      class={[
        'badge badge-soft mr-1',
        {
          'badge-success': isHealthy,
          'badge-error': !isHealthy,
        },
      ]}
    >
      <span
        class={[
          'status',
          {
            'status-success': isHealthy,
            'status-error': !isHealthy,
          },
        ]}
      ></span>
      {isHealthy ? 'up' : 'down'}
    </div>
  </Tooltip>
{/if}
