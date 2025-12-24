<script lang="ts">
  import { goto } from '$app/navigation';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { clusterHealthState } from '$lib/domains/app/clusters/application/cluster-health.state.svelte.js';
  import ClusterCreatorTile from '$lib/domains/app/clusters/ui/ClustersList/ClusterCreatorTile.svelte';
  import { type ServiceStatus } from '$lib/domains/app/clusters/ui/ClustersList/CircularHealthChart.svelte';
  import ClusterHealthSummary from '$lib/domains/app/clusters/ui/ClustersList/ClusterHealthSummary.svelte';
  import { type Cluster } from '$lib/domains/app/clusters/domain/cluster.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import type { MonitorStatus } from '$lib/domains/app/projects/domain/monitoring/monitor.js';

  type Props = {
    canCreate: boolean;
  };
  const { canCreate }: Props = $props();
  const ANIMATION_DELAY = 15;
  const CLUSTERS_COLUMNS = 2;

  let mounted = $state(false);

  onMount(() => {
    mounted = true;

    const clusterIds = clustersState.clusters.map((c) => c.id);
    const stopPolling = clusterHealthState.startPolling(clusterIds);

    return () => {
      stopPolling();
    };
  });

  function mapMonitorStatusToServiceStatus(
    status: MonitorStatus | undefined,
  ): ServiceStatus {
    switch (status) {
      case 'up':
        return 'healthy';
      case 'down':
        return 'unhealthy';
      case 'unknown':
      default:
        return 'unknown';
    }
  }

  function getClusterServices(cluster: Cluster): {
    id: string;
    name: string;
    status: ServiceStatus;
    features: Feature[];
  }[] {
    return (cluster.projects || []).map((project) => {
      const monitor = clusterHealthState.getMonitorByProjectId(
        cluster.id,
        project.id,
      );
      const status = mapMonitorStatusToServiceStatus(monitor?.lastStatus);

      return {
        id: project.id,
        name: project.name,
        status,
        features: project.features || [],
      };
    });
  }

  const projectsPerColumn = $derived.by(() => {
    const projectsPerColumn = [[], []];

    clustersState.clusters.forEach((project, i) => {
      const column = i % CLUSTERS_COLUMNS;
      projectsPerColumn[column].push(project);
    });

    return projectsPerColumn;
  });
</script>

{#if mounted}
  <div class="px-3 flex w-full gap-4 pb-8">
    <div class="flex w-full flex-col gap-4 sm:hidden">
      {#each clustersState.clusters as cluster, i}
        {@render clusterTile(cluster, i)}
      {/each}

      <ClusterCreatorTile
        canAddMore={canCreate}
        delayIn={clustersState.clusters.length * ANIMATION_DELAY}
      />
    </div>

    <div class="hidden w-full gap-1.5 sm:flex">
      {#each [0, 1] as column}
        <div class="flex w-full flex-col gap-1.5">
          {#each projectsPerColumn[column] as cluster, i}
            {@render clusterTile(cluster, i)}
          {/each}

          {#if (column === 0 && clustersState.clusters.length % 2 === 0) || (column === 1 && clustersState.clusters.length % 2 === 1)}
            {@const delay =
              ANIMATION_DELAY *
              (clustersState.clusters.length / CLUSTERS_COLUMNS + 10)}

            <ClusterCreatorTile canAddMore={canCreate} delayIn={delay} />
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

{#snippet clusterTile(cluster: Cluster, i: number)}
  {@const firstProjectId = cluster.projects?.[0]?.id}
  {@const services = getClusterServices(cluster)}
  {@const hasServices = services.length > 0}
  <div
    draggable="false"
    role="button"
    onclick={() => {
      goto(`/app/clusters/${cluster.id}`);
    }}
    class="ld-card-base h-fit w-full cursor-pointer ld-card-rounding p-6"
  >
    <div
      in:fly|global={{
        y: -2,
        duration: 300,
        delay: i * ANIMATION_DELAY,
        easing: cubicInOut,
      }}
      class="flex h-full w-full flex-col gap-1"
    >
      <div class="flex w-full items-center justify-between gap-2">
        <h5 class="text-lg font-semibold">
          {cluster.name}
        </h5>
      </div>

      {#if hasServices}
        <ClusterHealthSummary clusterId={cluster.id} {services} />

        <div class="flex flex-wrap gap-1.5">
          {#each cluster.projects as project}
            <a
              href={`/app/clusters/${cluster.id}/${project.id}`}
              draggable="false"
              role="button"
              onclick={(e) => {
                e.stopPropagation();
              }}
              class="badge badge-sm badge-soft badge-secondary hover:badge-primary hover:text-primary rounded-full transition-all"
            >
              {project.name}
            </a>
          {/each}
        </div>
      {:else}
        <div class="flex flex-col items-center gap-3 py-4">
          <div class="text-center">
            <p class="text-base-content/60 text-sm">No services configured</p>
            <p class="text-base-content/40 text-xs">
              Add a service to get started
            </p>
          </div>
          <button
            onclick={(e) => {
              e.stopPropagation();
              goto(`/app/clusters/${cluster.id}`);
            }}
            class="btn btn-sm btn-ghost gap-1"
          >
            <PlusIcon class="size-4" />
            Add service
          </button>
        </div>
      {/if}
    </div>
  </div>
{/snippet}
