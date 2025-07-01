<script lang="ts">
  import { page } from '$app/state';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import NotificationChannelsContextMenu
    from '$lib/domains/app/projects/ui/notification-channels/NotificationChannelsContextMenu.svelte';
  import MonitorContextMenu from '$lib/domains/app/projects/ui/monitor-status/MonitorContextMenu.svelte';
  import MonitorStatus from '$lib/domains/app/projects/ui/monitor-status/MonitorStatus.svelte';

  const { projectId } = $props();
  const projectMonitor = $derived(
    monitoringState.getMonitorByProjectId(projectId),
  );
  const clusterId = $derived(page.params.cluster_id);
  const isHealthy = $derived(monitoringState.isHealthy(projectMonitor?.id));
  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );
</script>

{#snippet fullStatus()}
  <MonitorStatus {projectId}>
    {#if !isOnDemoDashboard}
      <div class="flex w-full items-center gap-4">
        <MonitorContextMenu monitorId={projectMonitor.id} />

        <NotificationChannelsContextMenu
          monitorId={monitoringState.getMonitorByProjectId(projectId)?.id || ''}
          {clusterId}
        />
      </div>
    {/if}
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
