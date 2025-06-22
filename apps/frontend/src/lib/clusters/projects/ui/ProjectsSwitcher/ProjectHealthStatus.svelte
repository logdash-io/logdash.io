<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
  import { userState } from '$lib/shared/user/application/user.state.svelte';
  import { isDev } from '$lib/shared/utils/is-dev.util.js';
  import { monitoringState } from '../../application/monitoring.state.svelte.js';
  import NotificationChannelsContextMenu from '../notification-channels/NotificationChannelsContextMenu.svelte';
  import MonitorStatus from '../presentational/MonitorStatus.svelte';

  const { projectId } = $props();
  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );
  const projectMonitor = $derived(
    monitoringState.getMonitorByProjectId(projectId),
  );
  const clusterId = $derived(page.params.cluster_id);
  const isHealthy = $derived(monitoringState.isHealthy(projectMonitor?.id));
</script>

{#snippet fullStatus()}
  <MonitorStatus {projectId}>
    {#if isDev()}
      <NotificationChannelsContextMenu
        monitorId={monitoringState.getMonitorByProjectId(projectId)?.id || ''}
        {clusterId}
      />
    {/if}
  </MonitorStatus>
{/snippet}

{#if projectMonitor && (userState.hasEarlyAccess || isOnDemoDashboard)}
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
