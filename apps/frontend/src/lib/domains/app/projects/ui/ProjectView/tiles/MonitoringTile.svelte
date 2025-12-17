<script lang="ts">
  import { page } from '$app/state';
  import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { logger } from '$lib/domains/shared/logger';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import TrendingLinesIcon from '$lib/domains/shared/icons/TrendingLinesIcon.svelte';
  import { ChevronDownIcon } from 'lucide-svelte';
  import MonitorContextMenu from '../../monitor-status/MonitorContextMenu.svelte';
  import NotificationChannelsContextMenu from '../../notification-channels/NotificationChannelsContextMenu.svelte';
  import { MonitoringTimeRangeSelector } from '../../presentational/monitoring/index.js';
  import { untrack } from 'svelte';
  import {
    PingChart,
    StatusBadge,
    UptimeChart,
  } from '@logdash/hyper-ui/features';

  type Props = {
    projectId: string;
  };
  const { projectId }: Props = $props();
  const MAX_PINGS = 190;

  const projectMonitor = $derived(
    monitoringState.getMonitorByProjectId(projectId),
  );
  const isHealthy = $derived(monitoringState.isHealthy(projectMonitor?.id));
  const pings = $derived.by(() => {
    const pings = monitoringState.monitoringPings(projectMonitor?.id);
    return pings.slice(Math.max(0, pings.length - MAX_PINGS), pings.length);
  });
  const status = $derived(getStatusFromPings(pings));
  const isPaid = $derived(userState.isPaid);
  const pingBuckets = $derived(
    isPaid
      ? (monitoringState.getPingBuckets(projectMonitor?.id || '') ?? [])
      : monitoringState.getMockedPingBuckets(),
  );
  const uptime = $derived(
    isPaid
      ? (monitoringState.calculateUptime(projectMonitor?.id || '') ?? 0)
      : 98.5, // Mocked uptime for non-PRO users
  );
  const timeRange = $derived(monitoringState.timeRange);
  const clusterId = $derived(page.params.cluster_id);
  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );
  const PING_WIDTH_PX = 8;
  let pingsChartWidth = $state(0);
  const pingsToLoad = $derived(
    pingsChartWidth ? Math.floor(pingsChartWidth / PING_WIDTH_PX) : 0,
  );

  $effect(() => {
    if (!projectMonitor || !projectId) {
      logger.warn('No project monitor found for syncing pings.');
      return;
    }

    logger.debug(
      `Syncing pings for project monitor: ${projectMonitor?.id} (${pingsToLoad})`,
    );

    untrack(() => {
      return monitoringState.loadMonitorPings(
        projectId,
        projectMonitor?.id,
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
      `Syncing ping buckets for project monitor: ${projectMonitor?.id}`,
    );

    monitoringState.loadPingBuckets(
      projectMonitor.id,
      untrack(() => pingsToLoad),
    );
  });

  let open = $state(false);
  const statusConfig = {
    up: {
      text: 'Operational',
      color: 'text-green-600',
    },
    down: {
      text: 'Down',
      color: 'text-red-600',
    },
    degraded: {
      text: 'Degraded',
      color: 'text-yellow-600',
    },
    unknown: {
      text: 'Unknown',
      color: 'text-gray-400',
    },
  };

  const config = $derived(statusConfig[status]);
  const statusText = $derived(config.text);
  const statusColor = $derived(config.color);

  const handleTimeRangeChange = (newRange: typeof timeRange) => {
    monitoringState.setTimeRange(newRange);
  };
</script>

<div
  class="ld-card-bg ld-card-border ld-card-rounding relative w-full overflow-hidden"
>
  <div
    class="flex w-full flex-col items-end justify-center overflow-hidden p-6"
  >
    <div class="flex w-full items-center justify-between">
      <div class="flex items-center gap-3">
        <StatusBadge {status} />

        <div>
          <h4 class="text-secondary text-lg font-medium">
            {projectMonitor?.name}
          </h4>
        </div>
      </div>

      <div class="flex items-center gap-2 text-right">
        <div class={`text-sm font-medium ${statusColor}`}>
          {statusText}
        </div>

        <ChevronDownIcon
          class={`h-5 w-5 text-gray-500 transition-transform duration-200 group-hover:rotate-180 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>
    </div>

    <div
      class="z-10 flex w-full cursor-default overflow-hidden sm:mt-2"
      bind:clientWidth={pingsChartWidth}
    >
      <PingChart
        maxPingsToShow={MAX_PINGS}
        pings={pings.map((ping) => ({
          ...ping,
          createdAt: ping.createdAt.toISOString(),
        }))}
      />
    </div>
  </div>

  <div class="w-full p-0 text-sm">
    <div class="relative w-full px-6 sm:pb-6">
      {#if !isPaid}
        <div
          class="absolute inset-0 z-10 -mt-4 flex items-center justify-center"
        >
          <div
            class="text-primary flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-b from-black/30 to-black/90 px-4 py-2"
          >
            <div class="w-fit">
              <UpgradeButton source="monitor-historical-uptime">
                Upgrade to see historical uptime
              </UpgradeButton>
            </div>
          </div>
        </div>
      {/if}

      <div
        class="mb-2 flex flex-wrap items-center justify-between gap-6 text-sm"
      >
        <div class="flex items-center gap-2">
          <span class="text-base-content/80">
            {timeRange === '90h' ? '90-hour' : '90-day'} Uptime:
            <span class="font-mono font-medium text-base-content">
              {uptime?.toFixed(2)}%
            </span>
          </span>
        </div>

        <MonitoringTimeRangeSelector
          currentRange={timeRange}
          canSwitchTabs={isPaid}
          onRangeChange={handleTimeRangeChange}
        />
      </div>

      {#if isPaid}
        <UptimeChart
          buckets={pingBuckets}
          maxBucketsToShow={90}
          timeLabel={timeRange === '90h' ? 'hours ago' : 'days ago'}
        />
      {:else}
        <UptimeChart buckets={pingBuckets} timeLabel="days ago" />
      {/if}
    </div>
  </div>

  {#if !isOnDemoDashboard}
    <div class="flex w-full items-center gap-4 px-6 pb-6">
      <MonitorContextMenu monitorId={projectMonitor.id} />

      <NotificationChannelsContextMenu
        monitorId={monitoringState.getMonitorByProjectId(projectId)?.id || ''}
        {clusterId}
      />
    </div>
  {/if}
</div>
