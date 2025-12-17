<script lang="ts">
  import { page } from '$app/state';
  import ClusterSettings from '$lib/domains/app/clusters/ui/ClusterSettings/ClusterSettings.svelte';

  const clusterId = $derived(page.params.cluster_id);
</script>

<ClusterSettings {clusterId} />
