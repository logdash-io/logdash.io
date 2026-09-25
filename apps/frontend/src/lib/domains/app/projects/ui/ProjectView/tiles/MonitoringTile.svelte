<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
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
  import MonitorBadgeModal from './monitoring/MonitorBadgeModal.svelte';
  import { SettingsCardItem } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import ShieldCheckIcon from '$lib/domains/shared/icons/ShieldCheckIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';

  type Props = {
    clusterId: string;
    projectId: string;
    expanded?: boolean;
  };

  const { clusterId, projectId, expanded = false }: Props = $props();

  const projectMonitor = $derived(
    monitoringState.getMonitorByProjectId(projectId),
  );
  const monitorId = $derived(projectMonitor?.id || '');
  const monitorName = $derived(projectMonitor?.name || '');

  let isBadgeModalOpen = $state(false);

  const MAX_PINGS = 190;
  const PING_WIDTH_PX = 8;
  let pingsChartWidth = $state(0);
  const pingsToLoad = $derived(
    pingsChartWidth ? Math.floor(pingsChartWidth / PING_WIDTH_PX) : 0,
  );
  const maxPingsToShow = $derived(pingsToLoad || MAX_PINGS);

  const pings = $derived.by(() => {
    const allPings = monitoringState.monitoringPings(monitorId);
    return allPings.slice(-maxPingsToShow);
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

  const formattedPings = $derived(
    pings.map((ping) => ({
      ...ping,
      createdAt: ping.createdAt.toISOString(),
    })),
  );

  function onNavigateToMonitoring(): void {
    void goto(resolve(`/app/clusters/${clusterId}/${projectId}/monitoring`));
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
      void monitoringState.loadMonitorPings(
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

    void monitoringState.loadPingBuckets(projectMonitor.id);
  });

  onMount(() => {
    if (expanded) {
      void notificationChannelsState.loadChannels(clusterId);
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
      {
        'cursor-pointer group hover:bg-neutral-800': !expanded,
      },
    ]}
    disabled={expanded}
    onclick={onNavigateToMonitoring}
  >
    <MonitoringHeader name={monitorName} {status} showArrow={!expanded} />

    <div
      class="z-10 flex w-full cursor-default overflow-hidden sm:mt-2"
      bind:clientWidth={pingsChartWidth}
    >
      <PingChart {maxPingsToShow} pings={formattedPings} />
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

    <div
      class="flex w-full flex-col divide-y divide-hairline border-t border-border-default"
    >
      <NotificationChannelsSection {monitorId} />
      <SettingsCardItem
        icon={ShieldCheckIcon}
        showBorder={false}
        onclick={() => (isBadgeModalOpen = true)}
      >
        <p class="font-medium">README Badge</p>
        <p class="text-neutral-500">
          Show this monitor's uptime in your README
        </p>

        {#snippet action()}
          <ChevronRightIcon class="text-neutral-500 size-4 shrink-0" />
        {/snippet}
      </SettingsCardItem>
      <MonitorSettingsSection
        {monitorId}
        {monitorName}
        {clusterId}
        {projectId}
      />
    </div>
  {/if}
</div>

{#if projectMonitor}
  <MonitorBadgeModal
    isOpen={isBadgeModalOpen}
    onClose={() => (isBadgeModalOpen = false)}
    {clusterId}
    monitor={projectMonitor}
  />
{/if}
