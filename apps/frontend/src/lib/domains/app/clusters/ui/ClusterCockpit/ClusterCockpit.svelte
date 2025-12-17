<script lang="ts">
  import { goto } from '$app/navigation';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import HexagonIcon from '$lib/domains/shared/icons/HexagonIcon.svelte';
  import {
    ActivityIcon,
    ServerIcon,
    ScrollTextIcon,
    GaugeIcon,
    ChevronRightIcon,
  } from 'lucide-svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const cluster = $derived(clustersState.get(clusterId));

  function getServiceHealthStatus(projectId: string): boolean | null {
    const monitor = monitoringState.getMonitorByProjectId(projectId);
    if (!monitor) {
      return null;
    }
    return monitoringState.isHealthy(monitor.id);
  }

  function hasMonitor(projectId: string): boolean {
    return !!monitoringState.getMonitorByProjectId(projectId);
  }

  function hasFeature(projectId: string, feature: Feature): boolean {
    return projectsState.hasFeature(projectId, feature);
  }

  function getUptime(projectId: string): number {
    const monitor = monitoringState.getMonitorByProjectId(projectId);
    if (!monitor) return 0;
    return monitoringState.calculateUptime(monitor.id);
  }

  function onServiceSelect(projectId: string): void {
    goto(`/app/clusters/${clusterId}/${projectId}`);
  }
</script>

<div class="flex w-full flex-col gap-6 p-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">{cluster?.name || 'Project'}</h1>
      <p class="text-base-content/60 text-sm">Overview of all services</p>
    </div>
  </div>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each cluster?.projects || [] as project}
      {@const healthStatus = getServiceHealthStatus(project.id)}
      {@const projectHasMonitor = hasMonitor(project.id)}
      {@const uptime = getUptime(project.id)}
      {@const hasLogging = hasFeature(project.id, Feature.LOGGING)}
      {@const hasMetrics = hasFeature(project.id, Feature.METRICS)}

      <button
        onclick={() => onServiceSelect(project.id)}
        class="ld-card-base group flex cursor-pointer flex-col gap-4 rounded-2xl p-4 transition-all hover:bg-base-100/50"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            {#if projectHasMonitor}
              <div
                class={[
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  {
                    'bg-success/10': healthStatus === true,
                    'bg-error/10': healthStatus === false,
                  },
                ]}
              >
                <HexagonIcon
                  class="size-5 {healthStatus === true
                    ? 'text-success'
                    : 'text-error'}"
                />
              </div>
            {:else}
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-base-100"
              >
                <ServerIcon class="size-5 text-base-content/50" />
              </div>
            {/if}
            <div class="text-left">
              <h3 class="font-semibold">{project.name}</h3>
              {#if projectHasMonitor}
                <span
                  class={[
                    'text-xs',
                    {
                      'text-success': healthStatus === true,
                      'text-error': healthStatus === false,
                    },
                  ]}
                >
                  {healthStatus === true ? 'Healthy' : 'Unhealthy'}
                </span>
              {:else}
                <span class="text-base-content/50 text-xs">No monitor</span>
              {/if}
            </div>
          </div>
          <ChevronRightIcon
            class="size-5 text-base-content/30 transition-transform group-hover:translate-x-0.5"
          />
        </div>

        {#if projectHasMonitor && uptime > 0}
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-base-content/60">Uptime</span>
              <span
                class={[
                  'font-mono',
                  {
                    'text-success': uptime >= 99,
                    'text-warning': uptime >= 95 && uptime < 99,
                    'text-error': uptime < 95,
                  },
                ]}
              >
                {uptime.toFixed(2)}%
              </span>
            </div>
            <div class="bg-base-100 h-1 w-full rounded-full">
              <div
                class={[
                  'h-1 rounded-full transition-all',
                  {
                    'bg-success': uptime >= 99,
                    'bg-warning': uptime >= 95 && uptime < 99,
                    'bg-error': uptime < 95,
                  },
                ]}
                style="width: {uptime}%"
              ></div>
            </div>
          </div>
        {/if}

        <div class="mt-auto flex flex-wrap gap-1.5">
          {#if hasLogging}
            <div
              class="flex items-center gap-1 rounded-lg bg-base-100 px-2 py-1"
            >
              <ScrollTextIcon class="size-3 text-base-content/60" />
              <span class="text-xs text-base-content/60">Logs</span>
            </div>
          {/if}
          {#if hasMetrics}
            <div
              class="flex items-center gap-1 rounded-lg bg-base-100 px-2 py-1"
            >
              <GaugeIcon class="size-3 text-base-content/60" />
              <span class="text-xs text-base-content/60">Metrics</span>
            </div>
          {/if}
          {#if projectHasMonitor}
            <div
              class="flex items-center gap-1 rounded-lg bg-base-100 px-2 py-1"
            >
              <ActivityIcon class="size-3 text-base-content/60" />
              <span class="text-xs text-base-content/60">Monitor</span>
            </div>
          {/if}
          {#if !hasLogging && !hasMetrics && !projectHasMonitor}
            <div
              class="flex items-center gap-1 rounded-lg bg-base-100/50 px-2 py-1"
            >
              <span class="text-xs text-base-content/40">
                No features configured
              </span>
            </div>
          {/if}
        </div>
      </button>
    {/each}

    {#if !cluster?.projects?.length}
      <div
        class="col-span-full flex flex-col items-center justify-center py-12"
      >
        <ServerIcon class="mb-4 size-12 text-base-content/30" />
        <h3 class="text-lg font-semibold">No services yet</h3>
        <p class="text-base-content/60 text-sm">
          Create your first service to get started
        </p>
      </div>
    {/if}
  </div>
</div>
