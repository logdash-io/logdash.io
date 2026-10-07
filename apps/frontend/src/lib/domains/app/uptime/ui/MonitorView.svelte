<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { getStatusFromMonitor } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import {
    cronIntervalLabel,
    toChartPings,
  } from '$lib/domains/app/projects/application/monitor-pings.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import NotificationChannelSetupModal from '$lib/domains/app/projects/ui/notification-channels/NotificationChannelSetupModal.svelte';
  import MonitorPanel from '$lib/domains/app/projects/ui/service/MonitorPanel.svelte';
  import { monitorPanelContent } from '$lib/domains/app/projects/ui/service/monitor-panel-content.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { untrack } from 'svelte';
  import CatchAllCallout from './monitor/CatchAllCallout.svelte';
  import EditMonitorModal from './monitor/EditMonitorModal.svelte';
  import MonitorBadgeModal from './monitor/MonitorBadgeModal.svelte';
  import MonitorSettingsSection from './monitor/MonitorSettingsSection.svelte';
  import NotificationChannelsSection from './monitor/NotificationChannelsSection.svelte';
  import UptimeSection from './monitor/UptimeSection.svelte';
  import UptimeToolbar from './UptimeToolbar.svelte';
  import LiveIndicator from '$lib/domains/app/clusters/ui/ClusterShell/LiveIndicator.svelte';

  type Props = {
    clusterId: string;
    monitorId: string;
  };

  const { clusterId, monitorId }: Props = $props();

  const PINGS_TO_SHOW = 60;
  const CLOCK_TICK_MS = 1_000;

  let now = $state(Date.now());
  let loadedMonitorId = $state<string | null>(null);
  let failedMonitorId = $state<string | null>(null);
  let isBadgeModalOpen = $state(false);
  let isEditModalOpen = $state(false);

  const monitor = $derived(monitoringState.getMonitorById(monitorId));
  const pings = $derived(
    toChartPings(
      monitoringState.monitoringPings(monitorId).slice(-PINGS_TO_SHOW),
    ),
  );
  const timeRange = $derived(monitoringState.timeRange);
  const planInterval = $derived(
    cronIntervalLabel(
      exposedConfigState.pingFrequency(clustersState.get(clusterId)?.tier),
    ),
  );
  const content = $derived(
    monitor
      ? monitorPanelContent({
          monitor,
          pings,
          bucketUptime: monitoringState.calculateUptime(monitor.id),
          range: timeRange,
          now,
          loaded: loadedMonitorId === monitor.id,
          failed: failedMonitorId === monitor.id,
          planInterval,
        })
      : null,
  );

  $effect(() => topBarState.show(toolbar));

  $effect(() => {
    const id = clusterId;
    void untrack(() => monitoringState.sync(id));
    void untrack(() => notificationChannelsState.loadChannels(id));

    return () => monitoringState.unsync();
  });

  $effect(() => {
    const id = monitorId;

    untrack(() => {
      void loadPings(id);
      void monitoringState.loadPingBuckets(id);
    });
  });

  $effect(() => {
    const timer = setInterval(() => {
      now = Date.now();
    }, CLOCK_TICK_MS);

    return () => clearInterval(timer);
  });

  async function loadPings(id: string): Promise<void> {
    const loaded = await monitoringState.loadMonitorPings(
      clusterId,
      id,
      PINGS_TO_SHOW,
    );

    if (id !== monitorId) {
      return;
    }

    loadedMonitorId = id;
    failedMonitorId = loaded ? null : id;
  }

  function onEdit(): void {
    isEditModalOpen = true;
  }
</script>

<NotificationChannelSetupModal {clusterId} />

{#if monitor && content}
  <div class="@container flex w-full flex-col gap-2 p-2">
    <MonitorPanel {...content} status={getStatusFromMonitor(monitor)}>
      <CatchAllCallout {monitor} {onEdit} />
    </MonitorPanel>

    <UptimeSection
      label={monitor.name}
      {timeRange}
      pingBuckets={monitoringState.getPingBuckets(monitorId)}
    />

    <div class="grid items-start gap-2 @4xl:grid-cols-2">
      <NotificationChannelsSection {monitorId} />

      <MonitorSettingsSection
        {monitor}
        {clusterId}
        {onEdit}
        onGetBadge={() => (isBadgeModalOpen = true)}
      />
    </div>
  </div>

  <MonitorBadgeModal
    isOpen={isBadgeModalOpen}
    onClose={() => (isBadgeModalOpen = false)}
    {clusterId}
    {monitor}
  />
  <EditMonitorModal
    isOpen={isEditModalOpen}
    onClose={() => (isEditModalOpen = false)}
    {monitor}
  />
{:else}
  <p class="text-fg-muted p-6 text-sm" role="status">
    This monitor does not exist anymore.
  </p>
{/if}

{#snippet toolbar()}
  <div class="flex items-center gap-3">
    <LiveIndicator label="Live" />
    <UptimeToolbar {clusterId} add={false} />
  </div>
{/snippet}
