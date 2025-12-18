<script lang="ts">
  import { page } from '$app/state';
  import ClusterCockpit from '$lib/domains/app/clusters/ui/ClusterCockpit/ClusterCockpit.svelte';

  const clusterId = $derived(page.params.cluster_id);
</script>

<ClusterCockpit {clusterId} />
