<script lang="ts">
  import { getStatusFromMonitor } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import { toChartPings } from '$lib/domains/app/projects/application/monitor-pings.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import MonitorPanel from '../service/MonitorPanel.svelte';
  import { monitorPanelContent } from '../service/monitor-panel-content.js';

  type Props = {
    projectId: string;
    children?: Snippet;
  };

  const { projectId, children }: Props = $props();

  const PINGS_TO_SHOW = 60;
  const CLOCK_TICK_MS = 1_000;

  let now = $state(Date.now());
  let loadedMonitorId = $state<string | null>(null);
  let failedMonitorId = $state<string | null>(null);

  const monitor = $derived(monitoringState.getMonitorByProjectId(projectId));
  const monitorId = $derived(monitor?.id);
  const pings = $derived(
    monitor ? monitoringState.monitoringPings(monitor.id) : [],
  );
  const content = $derived(
    monitor
      ? monitorPanelContent({
          monitor,
          pings: toChartPings(pings.slice(-PINGS_TO_SHOW)),
          bucketUptime: monitoringState.calculateUptime(monitor.id),
          range: monitoringState.timeRange,
          now,
          loaded: pings.length > 0 || loadedMonitorId === monitor.id,
          failed: failedMonitorId === monitor.id,
        })
      : null,
  );

  $effect(() => {
    const id = monitorId;

    if (!id) {
      return;
    }

    untrack(() => {
      if (!pings.length) {
        void loadPings(id);
      }
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
</script>

{#if monitor && content}
  <div
    class="bg-surface-elevated-bg border-surface-elevated-border w-96 rounded-xl border shadow-[0_16px_40px_-8px_rgba(0,0,0,0.9)]"
  >
    <MonitorPanel
      {...content}
      eyebrowHref={undefined}
      status={getStatusFromMonitor(monitor)}
    >
      {@render children?.()}
    </MonitorPanel>
  </div>
{/if}
