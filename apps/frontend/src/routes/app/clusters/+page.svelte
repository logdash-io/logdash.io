<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import ClustersList from '$lib/domains/app/clusters/ui/ClustersList/ClustersList.svelte';
  import type { User } from '$lib/domains/shared/user/domain/user';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte';

  type Props = {
    data: {
      user: User;
    };
  };
  const { data }: Props = $props();

  const totalProjectsCount = $derived(clustersState.allClustersProjectsCount);
  const tierMaxProjects = $derived(
    exposedConfigState.maxNumberOfProjects(data.user.tier),
  );
</script>

<svelte:head>
  <title>Projects | Logdash</title>
</svelte:head>

<ClustersList canCreate={totalProjectsCount < tierMaxProjects} />
