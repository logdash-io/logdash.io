<script lang="ts">
  import { resolve } from '$app/paths';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import MetricsTiles from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import LogsTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
  import MonitoringTile from './tiles/MonitoringTile.svelte';

  type Props = {
    clusterId: string;
    projectId: string;
  };

  const { clusterId, projectId }: Props = $props();

  const hasMonitor = $derived(
    Boolean(monitoringState.getMonitorByProjectId(projectId)),
  );
</script>

<ProjectSync>
  <div class="flex flex-1 flex-col lg:relative">
    <div class="flex flex-col lg:absolute lg:inset-0 lg:flex-row">
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        {#if hasMonitor}
          <MonitoringTile {clusterId} {projectId} />
        {:else}
          <EmptyState
            class="border-hairline shrink-0 border-b p-4"
            title="No monitor yet"
            description="Add one to check that this service is up and how fast it answers."
          >
            <Button
              href={resolve(
                '/app/domains/[cluster_id]/[project_id]/monitoring',
                {
                  cluster_id: clusterId,
                  project_id: projectId,
                },
              )}
              variant="primary"
              size="sm"
            >
              <PlusIcon class="size-4" />
              Add monitor
            </Button>
          </EmptyState>
        {/if}

        <div class="flex min-h-0 flex-1 flex-col">
          <LogsTile />
        </div>
      </div>

      <div
        class="border-hairline flex shrink-0 flex-col max-lg:border-t lg:w-64 lg:overflow-y-auto lg:border-l xl:w-72"
      >
        <MetricsTiles />
      </div>
    </div>
  </div>
</ProjectSync>
