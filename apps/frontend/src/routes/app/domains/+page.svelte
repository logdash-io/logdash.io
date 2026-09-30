<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import ClustersList from '$lib/domains/app/clusters/ui/ClustersList/ClustersList.svelte';
</script>

<svelte:head>
  <title>Domains | Logdash</title>
</svelte:head>

<ClustersList canCreate={clustersState.canAddDomain} />
