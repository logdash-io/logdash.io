<script lang="ts">
  import { SETTINGS_PAGE_CLASS } from '$lib/domains/shared/ui/components/settings-card';
  import { resolve } from '$app/paths';
  import { getStatusFromMonitor } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import { toChartPings } from '$lib/domains/app/projects/application/monitor-pings.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { notificationChannelsState } from '$lib/domains/app/projects/application/notification-channels/notification-channels.state.svelte.js';
  import type { PingBucketPeriod } from '$lib/domains/app/projects/domain/monitoring/ping-bucket.js';
  import { untrack } from 'svelte';
  import MonitorPanel from '../../service/MonitorPanel.svelte';
  import { monitorPanelContent } from '../../service/monitor-panel-content.js';
  import CatchAllCallout from './monitoring/CatchAllCallout.svelte';
  import EditMonitorModal from './monitoring/EditMonitorModal.svelte';
  import MonitorBadgeModal from './monitoring/MonitorBadgeModal.svelte';
  import MonitorSettingsSection from './monitoring/MonitorSettingsSection.svelte';
  import NotificationChannelsSection from './monitoring/NotificationChannelsSection.svelte';
  import UptimeSection from './monitoring/UptimeSection.svelte';

  type Props = {
    clusterId: string;
    projectId: string;
    expanded?: boolean;
  };

  const { clusterId, projectId, expanded = false }: Props = $props();

  const PINGS_TO_SHOW = 60;
  const CLOCK_TICK_MS = 1_000;

  let now = $state(Date.now());
  let loadedMonitorId = $state<string | null>(null);
  let failedMonitorId = $state<string | null>(null);
  let isBadgeModalOpen = $state(false);
  let isEditModalOpen = $state(false);

  const monitor = $derived(monitoringState.getMonitorByProjectId(projectId));
  const monitorId = $derived(monitor?.id ?? '');
  const pings = $derived(
    toChartPings(
      monitoringState.monitoringPings(monitorId).slice(-PINGS_TO_SHOW),
    ),
  );
  const timeRange = $derived(monitoringState.timeRange);
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
        })
      : null,
  );
  const monitorPath = $derived(
    resolve('/app/domains/[cluster_id]/[project_id]/monitoring', {
      cluster_id: clusterId,
      project_id: projectId,
    }),
  );

  $effect(() => {
    const id = monitorId;

    if (!id) {
      return;
    }

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

  $effect(() => {
    if (expanded) {
      void notificationChannelsState.loadChannels(clusterId);
    }
  });

  async function loadPings(id: string): Promise<void> {
    const loaded = await monitoringState.loadMonitorPings(
      projectId,
      id,
      PINGS_TO_SHOW,
    );

    if (id !== monitorId) {
      return;
    }

    loadedMonitorId = id;
    failedMonitorId = loaded ? null : id;
  }

  function onTimeRangeChange(range: PingBucketPeriod): void {
    monitoringState.setTimeRange(range);
  }

  function onEdit(): void {
    isEditModalOpen = true;
  }
</script>

{#if monitor && content}
  <div class="shrink-0 edge-b">
    <MonitorPanel
      {...content}
      status={getStatusFromMonitor(monitor)}
      href={expanded ? undefined : monitorPath}
    >
      <CatchAllCallout {monitor} {onEdit} />
    </MonitorPanel>
  </div>

  {#if expanded}
    <UptimeSection
      label={monitor.name}
      {timeRange}
      pingBuckets={monitoringState.getPingBuckets(monitorId)}
      {onTimeRangeChange}
    />

    <div class={SETTINGS_PAGE_CLASS}>
      <NotificationChannelsSection {monitorId} />

      <MonitorSettingsSection
        {monitor}
        {clusterId}
        {projectId}
        {onEdit}
        onGetBadge={() => (isBadgeModalOpen = true)}
      />
    </div>
  {/if}

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
{/if}
