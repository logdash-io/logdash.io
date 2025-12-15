<script lang="ts">
  import { goto } from '$app/navigation';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { SettingsIcon } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import ClusterCreatorTile from '$lib/domains/app/clusters/ui/ClustersList/ClusterCreatorTile.svelte';
  import { type Cluster } from '$lib/domains/app/clusters/domain/cluster.js';
  import queryString from 'query-string';
  import ClusterContextMenu from '$lib/domains/app/clusters/ui/ClusterContextMenu.svelte';

  type Props = {
    canCreate: boolean;
  };
  const { canCreate }: Props = $props();
  const ANIMATION_DELAY = 15;
  const CLUSTERS_COLUMNS = 2;

  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });

  const projectsPerColumn = $derived.by(() => {
    const projectsPerColumn = [[], []];

    clustersState.clusters.forEach((project, i) => {
      const column = i % CLUSTERS_COLUMNS;
      projectsPerColumn[column].push(project);
    });

    return projectsPerColumn;
  });
</script>

{#snippet clusterTile(cluster: Cluster, i: number)}
  {@const qs = queryString.stringify({
    project_id: cluster.projects?.[0].id,
  })}
  <div
    draggable="false"
    role="button"
    onclick={() => {
      goto(`/app/clusters/${cluster.id}?${qs}`);
    }}
    class="ld-card-base h-fit w-full cursor-pointer rounded-xl p-7"
  >
    <div
      in:fly|global={{
        y: -2,
        duration: 300,
        delay: i * ANIMATION_DELAY,
        easing: cubicInOut,
      }}
      class="flex h-full w-full flex-col items-center justify-between gap-2"
    >
      <div class="flex w-full items-center justify-between gap-2 p-1">
        <h5 class="text-lg font-semibold">
          {cluster.name}
        </h5>

        <ClusterContextMenu clusterId={cluster.id} />
      </div>

      {#if cluster.projects?.length}
        <div class="w-full gap-2">
          {#each cluster.projects as project}
            <a
              href={`/app/clusters/${cluster.id}?project_id=${project.id}`}
              draggable="false"
              role="button"
              onclick={(e) => {
                e.stopPropagation();
              }}
              class="badge badge-md badge-soft badge-secondary hover:badge-primary hover:text-primary m-1 rounded-full transition-all"
            >
              {project.name}
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/snippet}

{#if mounted}
  <div class="mx-auto flex w-full gap-4 pb-8">
    <div class="flex w-full flex-col gap-4 sm:hidden">
      {#each clustersState.clusters as cluster, i}
        {@render clusterTile(cluster, i)}
      {/each}

      <ClusterCreatorTile
        canAddMore={canCreate}
        delayIn={clustersState.clusters.length * ANIMATION_DELAY}
        onSubmit={(name) => {
          clustersState.create(name).then((createdClusterId) => {
            toast.success('Project created!');
            goto(`/app/clusters/${createdClusterId}`);
          });
        }}
      />
    </div>

    <div class="hidden w-full gap-4 sm:flex">
      {#each [0, 1] as column}
        <div class="flex w-full flex-col gap-4">
          {#each projectsPerColumn[column] as cluster, i}
            {@render clusterTile(cluster, i)}
          {/each}

          {#if (column === 0 && clustersState.clusters.length % 2 === 0) || (column === 1 && clustersState.clusters.length % 2 === 1)}
            {@const delay =
              ANIMATION_DELAY *
              (clustersState.clusters.length / CLUSTERS_COLUMNS + 10)}

            <ClusterCreatorTile
              canAddMore={canCreate}
              delayIn={delay}
              onSubmit={(name) => {
                clustersState.create(name).then((createdClusterId) => {
                  toast.success('Project created!');
                  goto(`/app/clusters/${createdClusterId}`);
                });
              }}
            />
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
