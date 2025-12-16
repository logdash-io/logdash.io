<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { ChevronDownIcon } from 'lucide-svelte';
  import queryString from 'query-string';

  const currentCluster = $derived(clustersState.get(page.params.cluster_id));

  function onClusterSelect(clusterId: string, close: () => void): void {
    const cluster = clustersState.get(clusterId);
    const firstProjectId = cluster?.projects?.[0]?.id;
    const qs = firstProjectId
      ? queryString.stringify({ project_id: firstProjectId })
      : '';
    goto(`/app/clusters/${clusterId}${qs ? `?${qs}` : ''}`);
    close();
  }
</script>

{#snippet clusterDropdownMenu(close: () => void)}
  <div
    class="dropdown-content ld-card-base rounded-box z-1 w-full whitespace-nowrap p-2 shadow"
  >
    <ul>
      {#each clustersState.clusters as cluster}
        {@const isActive = cluster.id === page.params.cluster_id}
        <li>
          <button
            onclick={() => onClusterSelect(cluster.id, close)}
            class={[
              'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left',
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

<div class="mb-4">
  <Tooltip
    class="w-full"
    content={clusterDropdownMenu}
    interactive={true}
    placement="bottom"
    trigger="click"
    closeOnOutsideTooltipClick={true}
  >
    <button class="btn btn-sm btn-subtle w-full justify-between gap-1.5">
      <span class="flex items-center gap-2 truncate">
        <CubeIcon class="h-4 w-4 shrink-0" />
        {currentCluster?.name || 'Select cluster'}
      </span>
      <ChevronDownIcon class="h-4 w-4 shrink-0" />
    </button>
  </Tooltip>
</div>
