<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { logger } from '$lib/domains/shared/logger';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import type { Snippet } from 'svelte';
  import { PingChart } from '@logdash/hyper-ui/features';
  import { Badge, Spinner, StatusDot } from '@logdash/hyper-ui/presentational';

  type Props = {
    projectId: string;
    children: Snippet;
  };
  const { projectId, children }: Props = $props();
  const MAX_PINGS = 60;

  const projectMonitor = $derived(
    monitoringState.getMonitorByProjectId(projectId),
  );
  const isHealthy = $derived(
    projectMonitor ? monitoringState.isHealthy(projectMonitor.id) : false,
  );
  const healthVariant = $derived(isHealthy ? 'success' : 'error');
  const pings = $derived(
    projectMonitor
      ? monitoringState.monitoringPings(projectMonitor.id).slice(-MAX_PINGS)
      : [],
  );

  $effect(() => {
    logger.debug(`Syncing pings for project monitor: ${projectMonitor?.id}`);

    if (!projectMonitor || !projectId || pings.length) {
      logger.warn('Skipping pings sync.');
      return;
    }

    void monitoringState.loadMonitorPings(projectId, projectMonitor.id);
  });
</script>

<DataTile>
  <div class="flex w-full flex-col gap-2">
    <div class="flex w-full gap-2">
      <div class="flex w-full items-center gap-2">
        <h5 class="max-w-80 truncate text-2xl font-medium">
          {projectMonitor?.name}
        </h5>

        <Badge variant={healthVariant}>
          <StatusDot variant={healthVariant} />
          {isHealthy ? 'up' : 'down'}
        </Badge>
      </div>

      <Spinner variant="ring" size="sm" aria-hidden="true" />
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
