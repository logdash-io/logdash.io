<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { clusterPulseState } from '$lib/domains/app/clusters/application/cluster-pulse.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import SidebarClusterNav from './SidebarClusterNav.svelte';
  import SidebarDomainRow from './SidebarDomainRow.svelte';
  import SidebarServicesList from './SidebarServicesList.svelte';

  let collapsedClusterId = $state<string | null>(null);

  const openClusterId = $derived(page.params.cluster_id);

  function isExpanded(clusterId: string): boolean {
    return clusterId === openClusterId && clusterId !== collapsedClusterId;
  }

  function onProjectClick(clusterId: string): void {
    if (clusterId === openClusterId) {
      collapsedClusterId = isExpanded(clusterId) ? clusterId : null;
      return;
    }

    void goto(resolve('/app/domains/[cluster_id]', { cluster_id: clusterId }));
  }
</script>

{#each clustersState.clusters as cluster (cluster.id)}
  {@const expanded = isExpanded(cluster.id)}
  <SidebarDomainRow
    name={cluster.name}
    color={cluster.color}
    {expanded}
    online={clusterPulseState.online(cluster.id)}
    down={clusterPulseState.down(cluster.id)}
    ariaExpanded={cluster.id === openClusterId ? expanded : undefined}
    onclick={() => onProjectClick(cluster.id)}
  />

  {#if expanded}
    <SidebarClusterNav />
    <SidebarServicesList />
  {/if}
{/each}
