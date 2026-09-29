<script lang="ts">
  import { resolve } from '$app/paths';
  import { PingChart } from '@logdash/hyper-ui/features';
  import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import { logger } from '$lib/domains/shared/logger';
  import { onMount, untrack } from 'svelte';
  import MonitoringHeader from './monitoring/MonitoringHeader.svelte';
  import UptimeSection from './monitoring/UptimeSection.svelte';
  import NotificationChannelsSection from './monitoring/NotificationChannelsSection.svelte';
  import MonitorSettingsSection from './monitoring/MonitorSettingsSection.svelte';
  import MonitorBadgeModal from './monitoring/MonitorBadgeModal.svelte';
  import EditMonitorModal from './monitoring/EditMonitorModal.svelte';
  import CatchAllCallout from './monitoring/CatchAllCallout.svelte';
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
  let isEditModalOpen = $state(false);

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
  const timeRange = $derived(monitoringState.timeRange);
  const pingBuckets = $derived(monitoringState.getPingBuckets(monitorId));
  const uptime = $derived(monitoringState.calculateUptime(monitorId));

  const formattedPings = $derived(
    pings.map((ping) => ({
      ...ping,
      createdAt: ping.createdAt.toISOString(),
    })),
  );

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
    if (!projectMonitor || !projectId) {
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
  <div class="group relative">
    {#if !expanded}
      <a
        href={resolve('/app/clusters/[cluster_id]/[project_id]/monitoring', {
          cluster_id: clusterId,
          project_id: projectId,
        })}
        aria-label={`Open ${monitorName} monitoring`}
        class="ld-card-rounding group-hover:bg-neutral-800 focus-visible:outline-brand absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2"
      ></a>
    {/if}

    <div
      class={[
        'relative flex w-full flex-col p-6',
        { 'pointer-events-none': !expanded },
      ]}
    >
      <MonitoringHeader
        name={monitorName}
        url={projectMonitor?.url}
        {status}
        showArrow={!expanded}
      />

      <div
        class="pointer-events-auto mt-2 flex w-full cursor-default overflow-hidden"
        bind:clientWidth={pingsChartWidth}
      >
        <PingChart {maxPingsToShow} pings={formattedPings} />
      </div>

      {#if projectMonitor}
        <CatchAllCallout
          monitor={projectMonitor}
          onEdit={() => (isEditModalOpen = true)}
        />
      {/if}
    </div>
  </div>

  {#if expanded}
    <UptimeSection {uptime} {timeRange} {pingBuckets} {onTimeRangeChange} />

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
        {clusterId}
        {projectId}
        onEdit={() => (isEditModalOpen = true)}
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
  <EditMonitorModal
    isOpen={isEditModalOpen}
    onClose={() => (isEditModalOpen = false)}
    monitor={projectMonitor}
  />
{/if}
