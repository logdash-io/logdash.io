<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { PingChart } from '@logdash/hyper-ui/features';
  import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { logger } from '$lib/domains/shared/logger';
  import { onMount, untrack } from 'svelte';
  import MonitoringHeader from './monitoring/MonitoringHeader.svelte';
  import UptimeSection from './monitoring/UptimeSection.svelte';
  import NotificationChannelsSection from './monitoring/NotificationChannelsSection.svelte';
  import MonitorSettingsSection from './monitoring/MonitorSettingsSection.svelte';

  type Props = {
    projectId: string;
    expanded?: boolean;
  };

  const { projectId, expanded = false }: Props = $props();

  const clusterId = $derived(page.params.cluster_id);
  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );

  const projectMonitor = $derived(
    monitoringState.getMonitorByProjectId(projectId),
  );
  const monitorId = $derived(projectMonitor?.id || '');
  const monitorName = $derived(projectMonitor?.name || '');

  const MAX_PINGS = 190;
  const PING_WIDTH_PX = 8;
  let pingsChartWidth = $state(0);
  const pingsToLoad = $derived(
    pingsChartWidth ? Math.floor(pingsChartWidth / PING_WIDTH_PX) : 0,
  );

  const pings = $derived.by(() => {
    const allPings = monitoringState.monitoringPings(monitorId);
    return allPings.slice(Math.max(0, allPings.length - MAX_PINGS));
  });

  const status = $derived(getStatusFromPings(pings));
  const isPaid = $derived(userState.isPaid);
  const timeRange = $derived(monitoringState.timeRange);

  const pingBuckets = $derived(
    isPaid
      ? (monitoringState.getPingBuckets(monitorId) ?? [])
      : monitoringState.getMockedPingBuckets(),
  );

  const uptime = $derived(
    isPaid ? (monitoringState.calculateUptime(monitorId) ?? 0) : 98.5,
  );

  const monitoringTabPath = $derived(
    `/app/clusters/${clusterId}/${projectId}/monitoring`,
  );

  const formattedPings = $derived(
    pings.map((ping) => ({
      ...ping,
      createdAt: ping.createdAt.toISOString(),
    })),
  );

  function onNavigateToMonitoring(): void {
    goto(monitoringTabPath);
  }

  function onTimeRangeChange(newRange: typeof timeRange): void {
    monitoringState.setTimeRange(newRange);
  }

  $effect(() => {
    if (!projectMonitor || !projectId) {
      logger.warn('No project monitor found for syncing pings.');
      return;
    }

    logger.debug(
      `Syncing pings for project monitor: ${projectMonitor.id} (${pingsToLoad})`,
    );

    untrack(() => {
      monitoringState.loadMonitorPings(
        projectId,
        projectMonitor.id,
        untrack(() => pingsToLoad),
      );
    });
  });

  $effect(() => {
    if (!projectMonitor || !projectId || !isPaid) {
      logger.warn('Skipping ping buckets sync.');
      return;
    }

    logger.debug(
      `Syncing ping buckets for project monitor: ${projectMonitor.id}`,
    );

    monitoringState.loadPingBuckets(
      projectMonitor.id,
      untrack(() => pingsToLoad),
    );
  });

  onMount(() => {
    if (expanded) {
      notificationChannelsState.loadChannels(clusterId);
    }
  });
</script>

<div
  class="ld-card-bg ld-card-border ld-card-rounding relative w-full overflow-hidden"
>
  <button
    type="button"
    class={[
      'flex w-full flex-col items-end justify-center overflow-hidden p-6',
      { 'cursor-pointer group hover:bg-base-100/30': !expanded },
    ]}
    disabled={expanded}
    onclick={onNavigateToMonitoring}
  >
    <MonitoringHeader name={monitorName} {status} showArrow={!expanded} />

    <div
      class="z-10 flex w-full cursor-default overflow-hidden sm:mt-2"
      bind:clientWidth={pingsChartWidth}
    >
      <PingChart maxPingsToShow={MAX_PINGS} pings={formattedPings} />
    </div>
  </button>

  {#if expanded}
    <UptimeSection
      {uptime}
      {timeRange}
      {pingBuckets}
      {isPaid}
      {onTimeRangeChange}
    />

    {#if !isOnDemoDashboard}
      <div
        class="flex w-full flex-col divide-y divide-base-100/50 border-t border-base-100"
      >
        <NotificationChannelsSection {monitorId} />
        <MonitorSettingsSection
          {monitorId}
          {monitorName}
          {clusterId}
          {projectId}
        />
      </div>
    {/if}
  {/if}
</div>
