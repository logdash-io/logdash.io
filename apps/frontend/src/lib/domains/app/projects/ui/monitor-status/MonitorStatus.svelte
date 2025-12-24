<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { logger } from '$lib/domains/shared/logger';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import type { Snippet } from 'svelte';
  import { PingChart } from '@logdash/hyper-ui/features';

  type Props = {
    projectId: string;
    children: Snippet;
  };
  const { projectId, children }: Props = $props();
  const MAX_PINGS = 60;

  const projectMonitor = $derived(
    monitoringState.getMonitorByProjectId(projectId),
  );
  const isHealthy = $derived(monitoringState.isHealthy(projectMonitor?.id));
  const pings = $derived(
    monitoringState.monitoringPings(projectMonitor.id).slice(-MAX_PINGS),
  );

  $effect(() => {
    logger.debug(`Syncing pings for project monitor: ${projectMonitor?.id}`);

    if (!projectMonitor || !projectId || pings.length) {
      logger.warn('Skipping pings sync.');
      return;
    }

    monitoringState.loadMonitorPings(projectId, projectMonitor?.id);
  });
</script>

<DataTile>
  <div class="flex w-full flex-col gap-2">
    <div class="flex w-full gap-2">
      <div class="flex w-full items-center gap-2">
        <h5 class="max-w-80 truncate text-2xl font-semibold">
          {projectMonitor?.name}
        </h5>

        <div
          class={[
            'badge badge-soft',
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
      </div>

      <span class="loading loading-ring loading-sm duration-1000"></span>
    </div>

    <div class="flex w-full flex-col">
      <PingChart
        maxPingsToShow={MAX_PINGS}
        pings={pings.map((ping) => ({
          ...ping,
          createdAt: ping.createdAt.toISOString(),
        }))}
      />
    </div>

    {@render children()}
  </div>
</DataTile>
