<script lang="ts">
  import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
  import type { Cluster } from '$lib/clusters/clusters/domain/cluster';
  import ClustersList from '$lib/clusters/clusters/ui/ClustersList/ClustersList.svelte';
  import type { User } from '$lib/shared/user/domain/user';
  import { exposedConfigState } from '$lib/shared/exposed-config/application/exposed-config.state.svelte';

  type Props = {
    data: {
      clusters: Cluster[];
      user: User;
    };
  };
  const { data }: Props = $props();
</script>

<svelte:head>
  <title>all_clusters | logdash</title>
</svelte:head>

<ClustersList
  canCreate={clustersState.allClustersProjectsCount <
    exposedConfigState.maxNumberOfProjects(data.user.tier)}
/>
