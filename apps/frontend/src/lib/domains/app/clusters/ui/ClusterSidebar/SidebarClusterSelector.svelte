<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { ChevronDownIcon, ChevronRightIcon } from 'lucide-svelte';

  const currentCluster = $derived(clustersState.get(page.params.cluster_id));

  function onClusterSelect(clusterId: string, close: () => void): void {
    const cluster = clustersState.get(clusterId);
    const firstProjectId = cluster?.projects?.[0]?.id;
    if (firstProjectId) {
      goto(`/app/clusters/${clusterId}/${firstProjectId}`);
    } else {
      goto(`/app/clusters/${clusterId}`);
    }
    close();
  }
</script>

{#snippet clusterDropdownMenu(close: () => void)}
  <div
    class="dropdown-content ld-card-base rounded-2xl z-1 w-full whitespace-nowrap p-1 shadow-lg"
  >
    <ul class="flex flex-col gap-0.5">
      {#each clustersState.clusters as cluster}
        {@const isActive = cluster.id === page.params.cluster_id}
        <li>
          <button
            onclick={() => onClusterSelect(cluster.id, close)}
            class={[
              'flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm',
              {
                'bg-base-100': isActive,
                'hover:bg-base-100': !isActive,
              },
            ]}
          >
            <CubeIcon class="h-4 w-4 shrink-0" />
            <span class={[{ 'font-semibold': isActive }]}>
              {cluster.name}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

<div class="mb-1">
  <Tooltip
    class="w-full"
    content={clusterDropdownMenu}
    interactive={true}
    placement="right"
    align="top"
    trigger="click"
    closeOnOutsideTooltipClick={true}
  >
    <button
      class="flex group items-center cursor-pointer justify-between gap-1.5 hover:bg-base-100 rounded-lg p-1 pr-2 w-full select-none"
    >
      <span class="flex items-center gap-2 truncate font-medium">
        <div
          class={[
            'size-7 rounded-md flex items-center justify-center',
            {
              'bg-primary/15 border border-primary/5': currentCluster,
            },
          ]}
        >
          <CubeIcon class="size-4.5 shrink-0 text-primary" />
        </div>
        {currentCluster?.name || 'Select cluster'}
      </span>
      <ChevronRightIcon
        class="size-4.5 shrink-0 text-base-content/50 group-hover:translate-x-0.5 transition-transform group-hover:text-base-content"
      />
    </button>
  </Tooltip>
</div>
